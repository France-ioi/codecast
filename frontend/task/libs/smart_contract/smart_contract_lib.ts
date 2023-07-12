import {QuickAlgoLibrary} from "../quickalgo_library";
import {SmartContractView} from './SmartContractView';
import {
    generateGetSmartContractSpecificBlocks,
    SmartContractPlatform,
    smartContractPlatforms
} from './smart_contract_blocks';
import {LibraryTestResult} from '../library_test_result';
import {TaskSubmissionServerTestResult} from '../../../submission/submission_types';

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
    errorMessage?: string,
}

const localLanguageStrings = {
    fr: {
        categories: {
            'smart_contract_main_blocks': "Main blocks",
            'smart_contract_types': "Types",
        },
        description: {
        },
    },
};

export class SmartContractLib extends QuickAlgoLibrary {
    innerState: SmartContractLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        const conceptBaseUrl = (window.location.protocol == 'https:' ? 'https:' : 'http:') + '//'
            + 'static4.castor-informatique.fr/help/smart_contracts.html';

        this.notionsList = {
            // category: [list of notion names]
            "smart_contract_main_blocks": ["smart_contract", "entry_point"],
            "smart_contract_types": ["pairs"],
        };

        this.conceptList = [
            {
                id: 'smart_contract', // Must be the name of the notion
                name: 'Lorem',
                url: conceptBaseUrl + '#smart_contracts_lorem', // Must be the value of data-id in the documentation
            },
            {
                id: 'entry_point',
                name: 'Ipsum',
                url: conceptBaseUrl + '#smart_contracts_ipsum',
            },
        ];

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
