import {call, delay, put, race} from 'typed-redux-saga';
import {appSelect} from '../../hooks';
import {TaskAnswer} from '../../task/task_types';
import {documentToString} from '../../buffers/document';
import {ActionTypes as StepperActionTypes, ActionTypes, ContextEnrichingTypes} from '../actionTypes';
import log from 'loglevel';
import {AnalysisSnapshot, convertAnalysisDAPToCodecastFormat} from '../analysis/analysis';
import {LibraryTestResult} from '../../task/libs/library_test_result';
import {StepperContext} from '../api';
import AbstractRunner from '../abstract_runner';
import {StepperState} from '../index';
import {DeferredPromise} from '../../utils/app';

// TODO: add error handling

export type RemoteDebugListener = (message: RemoteDebugPayload) => void;

const CONNECTION_TIMEOUT = 5000;
const MESSAGE_TIMEOUT = 2000;

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
    }
}

export class RemoteDebugExecutor extends AbstractRunner {
    private ws: WebSocket;
    private listeners: {[messageId: number]: RemoteDebugListener[]} = {};
    private messageId: number = 0;
    private currentAnalysis: AnalysisSnapshot;

    public *compileAnswer(answer: TaskAnswer) {
        try {
            this.ws = yield* call([this, this.connectToServer]);
            this.listeners = [];
            log.getLogger('remote_execution').debug('[Remote] Remote connection established', answer);

            const answerContent = documentToString(answer.document);

            const response = yield* call([this, this.sendMessageAndWaitResponse], {
                action: 'start',
                answer: {
                    language: answer.platform,
                    fileName: answer.fileName,
                    sourceCode: answerContent,
                },
            });
            log.getLogger('remote_execution').debug('[Remote] Compilation made', response);

            if (!response.success) {
                throw new Error(response?.error?.message);
            }

            this.currentAnalysis = response.snapshot;
            yield* put({type: ActionTypes.CompileSucceeded});
        } catch (ex) {
            yield* put({type: ActionTypes.CompileFailed, payload: {testResult: LibraryTestResult.fromString(String(ex))}});
        }
    }

    public stop() {
        if (this.ws) {
            this.listeners = [];
            this.ws.close();
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
        const remoteExecutionWebSocketUrl = state.options.taskPlatformUrl.replace(/https?/g, 'ws') + '/remote-execution';
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
        const response = yield* call([this, this.sendMessageAndWaitResponse], {
            action: mode,
        });

        if (!response.success) {
            throw new Error(response?.error?.message);
        }

        this.currentAnalysis = response.snapshot;

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

    public enrichStepperState(stepperState: StepperState, context: ContextEnrichingTypes) {
        stepperState.analysis = this.currentAnalysis;
        if (!stepperState.lastAnalysis) {
            stepperState.lastAnalysis = this.currentAnalysis;
        }

        if (context === ContextEnrichingTypes.StepperProgress || context === ContextEnrichingTypes.StepperRestart) {
            stepperState.codecastAnalysis = convertAnalysisDAPToCodecastFormat(stepperState.analysis, stepperState.lastAnalysis);
        }
    }
}
