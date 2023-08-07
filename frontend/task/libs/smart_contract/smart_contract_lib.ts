import {QuickAlgoLibrary} from "../quickalgo_library";
import {SmartContractView} from './SmartContractView';
import {
    generateGetSmartContractSpecificBlocks,
    SmartContractPlatform,
    smartContractPlatforms
} from './smart_contract_blocks';
import {LibraryTestResult} from '../library_test_result';
import {SubmissionTestErrorCode, TaskSubmissionServerTestResult} from '../../../submission/submission_types';
import {NotionArborescence} from '../../blocks/notions';
import {DocumentationConcept} from '../../documentation/documentation_slice';
import {Block} from '../../blocks/block_types';

export interface SmartContractResultLogLine {
    amount: number,
    as: string,
    command: string,
    date: string,
    fail?: string,
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

    getContextStateFromTestResult(testResult: TaskSubmissionServerTestResult): SmartContractLibState {
        const output = JSON.parse(testResult.output);
        const log = output.log;

        return {
            resultLog: log,
            success: SubmissionTestErrorCode.NoError === testResult.errorCode,
            errorMessage: output.error?.message,
        };
    }

    getErrorFromTestResult(testResult: TaskSubmissionServerTestResult): LibraryTestResult {
        try {
            const output = JSON.parse(testResult.output);
            if (!output.error?.message) {
                return null;
            }

            return new LibraryTestResult(
                output.error?.message
            );
        } catch (e) {
            return LibraryTestResult.fromString(testResult.log);
        }
    }
}
