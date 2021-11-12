import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes as StepperActionTypes} from '../stepper/actionTypes';
import {Bundle} from "../linker";
import {put, takeEvery} from "redux-saga/effects";

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state, {payload: {options, query}}) => {
        state.options = options;

        if (!query) {
            return;
        }

        if ('language' in query) {
            options.language = query.language;
        }

        if ('noLanguageChange' in query) {
            options.canChangeLanguage = false;
        }

        (query.stepperControls || '').split(',').forEach(function (controlStr) {
            // No prefix to highlight, '-' to disable.
            const m = /^([-_])?(.*)$/.exec(controlStr);
            if (m) {
                options.controls[m[2]] = m[1] || '+';
            }
        });
        if ('noStepper' in query) {
            options.showStepper = false;
            options.showStack = false;
            options.showViews = false;
            options.showIO = false;
        }
        if ('noStack' in query) {
            options.showStack = false;
        }
        if ('noViews' in query) {
            options.showViews = false;
        }
        if ('noIO' in query) {
            options.showIO = false;
        }
        if ('noMenu' in query) {
            options.showMenu = false;
        }
        if ('noDoc' in query) {
            options.showDocumentation = false;
        }
        if ('noFullScreen' in query) {
            options.showFullScreen = false;
        }
        if ('record' in query) {
            options.canRecord = true;
        }
        if ('platform' in query) {
            options.platform = query.platform;
            options.canChangePlatform = false;
        }

        if ('source' in query) {
            options.source = query.source || '';
        }
        if ('input' in query) {
            options.input = query.input || '';
        }
        if ('level' in query) {
            options.level = query.level || null;
        }
    });

    bundle.defineAction(ActionTypes.PlatformChanged);
    bundle.addReducer(ActionTypes.PlatformChanged, (state, {payload: platform}) => {
        state.options.platform = platform;
        state.compile = {...initialStateCompile};
    });

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.PlatformChanged, function* () {
            yield put({type: StepperActionTypes.StepperExit});
        });
    });
}
