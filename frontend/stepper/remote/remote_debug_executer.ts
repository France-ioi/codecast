import {call, put, race} from 'typed-redux-saga';
import {delay} from '../../player/sagas';
import {appSelect} from '../../hooks';
import {TaskAnswer} from '../../task/task_types';
import {documentToString} from '../../buffers/document';
import {ActionTypes as StepperActionTypes, ActionTypes, ContextEnrichingTypes} from '../actionTypes';
import log from 'loglevel';
import {AnalysisSnapshot, convertAnalysisDAPToCodecastFormat} from '../analysis/analysis';
import {LibraryTestResult} from '../../task/libs/library_test_result';
import {inUserCode, StepperContext, StepperError} from '../api';
import AbstractRunner from '../abstract_runner';
import {StepperState} from '../index';
import {DeferredPromise} from '../../utils/app';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {CodecastPlatform} from '../codecast_platform';

export type RemoteDebugListener = (message: RemoteDebugPayload) => void;

const CONNECTION_TIMEOUT = 50000;
const MESSAGE_TIMEOUT = 20000;
export const remoteDebugSupportedPlatforms = [
    CodecastPlatform.C,
    CodecastPlatform.Cpp,
    CodecastPlatform.Java,
    CodecastPlatform.Python,
];

export interface RemoteDebugMessage {
    messageId: number,
    message: RemoteDebugPayload,
}

export interface RemoteDebugPayload {
    success: boolean,
    snapshot?: AnalysisSnapshot,
    error?: {
        type?: string,
        message?: string,
    },
}

export class RemoteDebugExecutor extends AbstractRunner {
    private ws: WebSocket;
    private listeners: {[messageId: number]: RemoteDebugListener[]} = {};
    private messageId: number = 0;
    private currentAnalysis: AnalysisSnapshot;

    public static needsCompilation(): boolean {
        return true;
    }

    public *compileAnswer(answer: TaskAnswer) {
        try {
            this.ws = yield* call([this, this.connectToServer]);
            this.listeners = [];
            log.getLogger('remote_execution').debug('[Remote] Remote connection established', answer);

            const answerContent = documentToString(answer.document);

            const context = quickAlgoLibraries.getContext('printer', 'main');
            // @ts-ignore
            const input: string = context?.getInputText ? context?.getInputText() : null;

            const response = yield* call([this, this.sendMessageAndWaitResponse], {
                action: 'start',
                answer: {
                    language: answer.platform,
                    fileName: answer.fileName,
                    sourceCode: answerContent,
                    input,
                },
            });
            log.getLogger('remote_execution').debug('[Remote] Compilation made', response);

            if (response?.error?.message) {
                throw new Error(response?.error?.message);
            }
            if (response?.snapshot?.terminatedReason) {
                throw new LibraryTestResult(null, 'compilation', {content: response?.snapshot?.terminatedReason})
            }

            this.currentAnalysis = response.snapshot;
            yield* put({type: ActionTypes.CompileSucceeded});
        } catch (ex) {
            const testResult = ex instanceof LibraryTestResult ? ex : LibraryTestResult.fromString(String(ex));
            yield* put({type: ActionTypes.CompileFailed, payload: {testResult}});
        }
    }

    public async programInitialization(): Promise<void> {
        this.registerNewThread(null, true);
    }

    public stop() {
        if (this.ws) {
            this.listeners = [];
            this.sendMessage({
                action: 'close',
            });
            this.ws.close();
            this.ws = null;
        }
    }

    private onMessage(messageId: number, listener: RemoteDebugListener) {
        if (!(messageId in this.listeners)) {
            this.listeners[messageId] = [];
        }
        this.listeners[messageId].push(listener);
    };

    private *connectToServer(): Generator<any, WebSocket> {
        const state = yield* appSelect();
        const remoteExecutionWebSocketUrl = state.options.taskPlatformUrl.replace(/http(s)?/g, 'ws$1') + '/remote-execution';
        const ws = new WebSocket(remoteExecutionWebSocketUrl);

        const promise = () => new Promise<void>((resolve, reject) => {
            const timer = setInterval(() => {
                if (ws.readyState === 1) {
                    clearInterval(timer);

                    ws.onmessage = (webSocketMessage) => {
                        const messageBody = JSON.parse(webSocketMessage.data) as RemoteDebugMessage;
                        if (!(messageBody.messageId in this.listeners)) {
                            return;
                        }
                        for (let listener of this.listeners[messageBody.messageId]) {
                            listener(messageBody.message);
                        }
                    };

                    resolve();
                }
            }, 10);
        });

        const outcome = yield* race({
            timeout: delay(CONNECTION_TIMEOUT),
            received: call(promise),
        });
        if (outcome.timeout) {
            yield* call([this, this.stop]);
            throw new Error('Remote Debug Executor has timeout');
        }

        return ws;
    }

    public sendMessage(message: unknown) {
        const messageId = this.messageId;

        const encapsulatedMessage = {
            messageId,
            message,
        };

        this.messageId++;

        this.ws.send(JSON.stringify(encapsulatedMessage));
    }

    public *executeAction(stepperContext: StepperContext, mode) {
        if ('run' === mode) {
            do {
                yield* call([this, this.executeSingleStep], stepperContext, 'run');
            } while (!stepperContext.state.isFinished);
        } else {
            yield* call([this, this.executeSingleStep], stepperContext, mode);
        }
    }

    public *executeSingleStep(stepperContext: StepperContext, mode) {
        let response: RemoteDebugPayload;
        try {
            yield stepperContext.interactBefore();

            let parameters = {
                action: mode,
                speed: yield* appSelect(state => Math.floor(state.stepper.speed / 10)),
            };
            if ('run' === mode) {
                parameters.action = 'into';
            } else {
                delete parameters.speed;
            }

            response = yield* call([this, this.sendMessageAndWaitResponse], parameters);
        } catch (error) {
            if (error instanceof StepperError) {
                throw error;
            }

            // @ts-ignore
            throw new StepperError('error', error.message);
        }

        if (response?.error?.message || response?.snapshot?.terminatedReason) {
            throw new StepperError('error', response?.error?.message ?? response?.snapshot?.terminatedReason);
        }

        this.currentAnalysis = response.snapshot;

        if (this.currentAnalysis.stdout) {
            for (let line of this.currentAnalysis.stdout) {
                const normalizedLine = line.replace(/\r/g, "\n");
                yield stepperContext.quickAlgoCallsExecutor('printer', 'print_end', [normalizedLine, '']);
            }
        }

        const arg = {};
        const deferredPromise = new DeferredPromise();

        yield* put({
            type: StepperActionTypes.StepperInteract,
            payload: {stepperContext, arg},
            meta: {resolve: deferredPromise.resolve, reject: deferredPromise.reject},
        });

        yield deferredPromise.promise;
    }

    public *sendMessageAndWaitResponse(message: unknown): Generator<any, RemoteDebugPayload> {
        const promise = (): Promise<RemoteDebugPayload> => {
            const messageId = this.messageId;

            const promise = new Promise<RemoteDebugPayload>((resolve) => {
                log.getLogger('remote_execution').debug('[Remote] Send message', message);
                this.onMessage(messageId, (message) => {
                    log.getLogger('remote_execution').debug('[Remote] Receive message', message);
                    resolve(message);
                })
            });

            this.sendMessage(message);

            return promise;
        };

        const outcome = yield* race({
            timeout: delay(MESSAGE_TIMEOUT),
            received: call(promise),
        });
        if (outcome.timeout) {
            yield* call([this, this.stop]);
            throw new Error('Remote Debug Executor has timeout');
        }

        return outcome.received;
    }

    public enrichStepperState(stepperState: StepperState, context: ContextEnrichingTypes, stepperContext?: StepperContext) {
        stepperState.analysis = this.currentAnalysis;
        if (stepperState.analysis.terminated) {
            stepperState.isFinished = true;
        }
        if (!stepperState.lastAnalysis) {
            stepperState.lastAnalysis = this.currentAnalysis;
        }

        if (stepperState.analysis.stackFrames?.length && (context === ContextEnrichingTypes.StepperProgress || context === ContextEnrichingTypes.StepperRestart)) {
            stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis);
        }

        super.enrichStepperState(stepperState, context, stepperContext);
    }
}
