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
import {TaskTest} from '../../task_types';
import {PlatformData} from '../../../stepper/platforms';

export interface SmartContractResultLogLine {
    address?: string,
    amount: number,
    as?: string,
    balances?: { [key: string]: number },
    balance_updates?: {
        dest: string,
        value: string
    }[],
    command?: string,
    date?: string,
    destination?: string
    error?: { type: string, message: string },
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

export const smartContractPlatformsList: {[key: string]: PlatformData} = {
    [SmartContractPlatform.SmartPy]: {aceSourceMode: 'python', extension: 'py', displayBlocks: true, needsCompilation: true, getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.SmartPy)},
    [SmartContractPlatform.Archetype]: {aceSourceMode: 'archetype', extension: 'arl', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.Archetype)},
    [SmartContractPlatform.Michelson]: {aceSourceMode: 'michelson', extension: 'tz', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.Michelson)},
    [SmartContractPlatform.CameLIGO]: {aceSourceMode: 'ocaml', extension: 'ml', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.CameLIGO)},
    [SmartContractPlatform.JsLIGO]: {aceSourceMode: 'javascript', extension: 'js', displayBlocks: true, needsCompilation: true,getSpecificBlocks: generateGetSmartContractSpecificBlocks(SmartContractPlatform.JsLIGO)},
};

interface SmartContractOutput {
    error?: { type: string, message: string },
    log: SmartContractResultLogLine[],
    expected?: SmartContractResultLogLine[],
    decoded: boolean, // Whether it was decoded from the test result output
}

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

export function isContract(address: string): boolean {
    return address && !address.startsWith('tz1');
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

    getOutputFromTestResult(testResult: TaskSubmissionServerTestResult): SmartContractOutput {
        const testResultSplit = testResult.log.trim().split("\n");
        let output = { log: [], decoded: false };
        let jsonFirstIndex = 0;
        while (jsonFirstIndex != -1) {
            jsonFirstIndex = testResultSplit.slice(jsonFirstIndex).findIndex(line => line.trim().startsWith('{'));
            const testResultJson = testResultSplit.slice(jsonFirstIndex).join("\n");

            try {
                output = JSON.parse(testResultJson);
                output.decoded = true;
                break;
            } catch (e) {
                jsonFirstIndex++;
            }
        }
        return output;
    }


    getContextStateFromTestResult(testResult: TaskSubmissionServerTestResult, test: TaskTest): SmartContractLibState {
        const output = this.getOutputFromTestResult(testResult);
        const log = output.log;

        return {
            resultLog: log,
            success: SubmissionTestErrorCode.NoError === testResult.errorCode,
            errorMessage: output.error?.message,
        };
    }

    getErrorFromTestResult(testResult: TaskSubmissionServerTestResult): LibraryTestResult {
        const output = this.getOutputFromTestResult(testResult);
        if (!output.decoded) {
            return LibraryTestResult.fromString(testResult.log);
        }
        if (!output.error?.message) {
            return null;
        }

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
        );
    }

    showViews() {
        return true;
    }
}
