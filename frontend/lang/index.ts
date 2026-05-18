import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {Bundle} from "../linker";
import {call, put, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {isLocalStorageEnabled} from "../common/utils";
import {delay} from "../player/sagas";
import {currentTaskChange, currentTaskChangePredefined} from '../task/task_slice';
import {appSelect} from '../hooks';
import {createQuickalgoLibrary} from '../task/libs/quickalgo_library_factory';
import {Languages, setLanguageReducer, updateLanguageCalls} from './messages';

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state, {payload: {options}}) => {
        let language = 'fr-FR';
        if (navigator.language in Languages) {
            language = navigator.language;
        }
        if (isLocalStorageEnabled() && window.localStorage.getItem('language') && window.localStorage.getItem('language') in Languages) {
            language = window.localStorage.getItem('language');
        }
        if (options.language) {
            if (options.language in Languages) {
                language = options.language;
            } else {
                // Try to find a matching language
                for (let key of Object.keys(Languages)) {
                    if (key.includes(options.language)) {
                        language = key;
                        break;
                    }
                }
            }
        }

        window.stringsLanguage = language.split('-')[0];

        setLanguageReducer(state, {payload: {language}});
    });

    bundle.defineAction(ActionTypes.LanguageSet);
    bundle.addReducer(ActionTypes.LanguageSet, setLanguageReducer);

    bundle.addSaga(function* () {
        // Quit stepper and reload task (and current context) after each language selection
        // @ts-ignore
        yield* takeEvery(ActionTypes.LanguageSet, function* ({payload}) {
            // @ts-ignore
            if (payload.withoutTaskReload) {
                return;
            }

            yield* delay(0);
            yield* put({type: StepperActionTypes.StepperExit});
            yield* call(createQuickalgoLibrary);
        });

        yield* takeEvery([currentTaskChange, currentTaskChangePredefined], function* () {
            const state = yield* appSelect();
            updateLanguageCalls(state);
        });
    });
}
