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

interface SmartContractLibState {
    resultLog?: SmartContractResultLogLine[],
    errorMessage?: string,
}

export class SmartContractLib extends QuickAlgoLibrary {
    innerState: SmartContractLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings({});

        //TODO: Update concepts

        const conceptBaseUrl = (window.location.protocol == 'https:' ? 'https:' : 'http:') + '//'
            + 'static4.castor-informatique.fr/help/printer_codecast.html';

        this.conceptList = [
            {
                id: 'printer_introduction',
                name: 'Les entrées/sorties',
                url: conceptBaseUrl + '#printer_introduction',
                isBase: true
            },
            {id: 'printer_print', name: 'Afficher une ligne', url: conceptBaseUrl + '#printer_print', isBase: true},
            {id: 'printer_read', name: 'Lire une ligne', url: conceptBaseUrl + '#printer_read', isBase: true}
        ];

        this.innerState = {};
    }

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
            if (payload.error && 'task-submission-test-result-smart-contract' === payload.error.type) {
                // state
                const log = payload.error.props.log;
                const environment = yield* appSelect(state => state.environment);
                const context = quickAlgoLibraries.getContext(null, environment);
                if (context) {
                    const innerState: SmartContractLibState = {
                        resultLog: log,
                        errorMessage: payload.error.error,
                    };

                    yield* call(quickAlgoLibraryResetAndReloadStateSaga, app, innerState);
                    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
                }
            }
        });
    }

    getErrorFromTestResult(testResult: TaskSubmissionServerTestResult) {
        try {
            const output = JSON.parse(testResult.output);

            return {
                type: 'task-submission-test-result-smart-contract',
                props: {
                    log: output.log,
                },
                ...(output.error ? {error: output.error.message} : {}),
            };

        } catch (e) {
            return testResult.log;
        }
    }
}
