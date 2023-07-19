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
    amount: number,
    as: string,
    command: string,
    date: string,
    failed?: boolean,
    kind: string,
    source: string,
    stderr?: string,
    stdout?: string,
    storage: any,
    updated_storage?: any,
    operation?: string,
    entrypoint?: string,
    arg?: string,
    storage_size: number,
    consumed_gas: number,
    paid_storage_size_diff: number,

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

                    yield* call(quickAlgoLibraryResetAndReloadStateSaga, app, innerState);
                    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
                }
            }
        });
    }

    getErrorFromTestResult(testResult: TaskSubmissionServerTestResult): LibraryTestResult {
        try {
            const output = JSON.parse(testResult.output);

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
}
