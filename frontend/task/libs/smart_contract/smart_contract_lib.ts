import {QuickAlgoLibrary} from "../quickalgo_library";
import {call, put, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../../../stepper/actionTypes";
import {App} from "../../../index";
import log from 'loglevel';
import {SmartContractView} from './SmartContractView';
import {
    TaskSubmissionServerTestResult,
} from '../../../submission/submission';
import {appSelect} from '../../../hooks';
import {
    quickAlgoLibraries,
    QuickAlgoLibrariesActionType,
    quickAlgoLibraryResetAndReloadStateSaga
} from '../quickalgo_libraries';
import {
    generateGetSmartContractSpecificBlocks,
    SmartContractPlatform,
    smartContractPlatforms
} from './smart_contract_blocks';
import {LibraryTestResult} from '../library_test_result';
import {SubmissionTestErrorCode} from '../../../submission/task_platform';
import {NotionArborescence} from '../../blocks/notions';
import {DocumentationConcept} from '../../documentation/documentation_slice';
import {Block} from '../../blocks/blocks';

export interface SmartContractResultLogLine {
    address?: string,
    amount: number,
    as?: string,
    command?: string,
    date?: string,
    destination?: string
    fail?: string,
    failed?: boolean,
    isFailed?: boolean,
    kind?: string,
    level?: number,
    name?: string,
    now?: string,
    source: string,
    stderr?: string,
    stdout?: string,
    storage?: any,
    updated_storage?: any,
    operation?: string,
    entrypoint?: string,
    arg?: string,
    storage_size?: number,
    consumed_gas?: number,
    paid_storage_size_diff?: number,
    internal_operations?: any[], // Left as any because format might change to correspond to SmartContractResultLogLine soon, but currently isn't
    internal?: boolean,
    expected?: SmartContractResultLogLine,
}

export const smartContractPlatformsList = {
    [SmartContractPlatform.SmartPy]: {aceSourceMode: 'python', displayBlocks: true, needsCompilation: true, getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.SmartPy)},
    [SmartContractPlatform.Archetype]: {aceSourceMode: 'archetype', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.Archetype)},
    [SmartContractPlatform.Michelson]: {aceSourceMode: 'michelson', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.Michelson)},
    [SmartContractPlatform.CameLIGO]: {aceSourceMode: 'ocaml', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.CameLIGO)},
    [SmartContractPlatform.JsLIGO]: {aceSourceMode: 'javascript', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.JsLIGO)},
};

interface SmartContractLibState {
    resultLog?: SmartContractResultLogLine[],
    success?: boolean,
    errorMessage?: string,
}

export interface SmartContractConfigType {
    localLanguageStrings: {[lang: string]: any},
    notionsList: NotionArborescence,
    conceptsList: DocumentationConcept[],
    smartContractsBlocksList: {[platform: string]: {[notion: string]: Block[]}},
}

export class SmartContractLib extends QuickAlgoLibrary {
    innerState: SmartContractLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(window.SmartContractConfig.localLanguageStrings);

        this.notionsList = window.SmartContractConfig.notionsList;

        this.conceptList = window.SmartContractConfig.conceptsList;

        this.innerState = {};
    }

    getSupportedPlatforms() {
        return smartContractPlatforms;
    };

    getInnerState() {
        return this.innerState;
    };

    implementsInnerState() {
        return true;
    }

    reloadInnerState(data): void {
        this.innerState = data;
    };

    getComponent() {
        return this.display ? SmartContractView : null;
    };

    usesStack() {
        return false;
    }

    *getSaga(app: App) {
        log.getLogger('smart_contract_lib').debug('Start Smart Contract Lib Saga');

        yield* takeEvery(StepperActionTypes.StepperDisplayError, function* (action) {
            // @ts-ignore
            const {payload} = action;
            if (payload.error instanceof LibraryTestResult && 'task-submission-test-result-smart-contract' === payload.error.getType()) {
                // state
                const log = payload.error.props.log;
                const environment = yield* appSelect(state => state.environment);
                const context = quickAlgoLibraries.getContext(null, environment);
                if (context) {
                    const innerState: SmartContractLibState = {
                        resultLog: log,
                        success: payload.error.props.success,
                        errorMessage: payload.error.message,
                    };

                    yield* call(quickAlgoLibraryResetAndReloadStateSaga, {smart_contract: innerState});
                    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
                }
            }
        });
    }

    getErrorFromTestResult(testResult: TaskSubmissionServerTestResult): LibraryTestResult {
        try {
            const testResultSplit = testResult.log.trim().split("\n");
            const jsonFirstIndex = testResultSplit.findIndex(line => line.trim().startsWith('{'));
            const testResultJson = testResultSplit.slice(jsonFirstIndex).join("\n");

            const output = JSON.parse(testResultJson);

            const log = output.log;
            if (output.error && log.length) {
                log[log.length - 1].error = output.error;
            }
            if (output.expected) {
                for (let i = 0; i < log.length; i++) {
                    log[i].expected = output.expected[i];
                }
            }

            return new LibraryTestResult(
                output.error?.message,
                'task-submission-test-result-smart-contract',
                {
                    log: output.log,
                    success: SubmissionTestErrorCode.NoError === testResult.errorCode,
                },
            );
        } catch (e) {
            return LibraryTestResult.fromString(testResult.log);
        }
    }

    showViews() {
        return true;
    }
}
