import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes as StepperActionTypes} from '../stepper/actionTypes';
import {Bundle} from "../linker";
import {put, takeEvery} from "typed-redux-saga";
import {AppStore, CodecastOptions, CodecastOptionsMode} from "../store";
import {parseCodecastUrl} from "../../backend/options";

function loadOptionsFromQuery(options: CodecastOptions, query) {
    if ('language' in query) {
        state.options.language = query.language;
    }

    if ('noLanguageChange' in query) {
        state.options.canChangeLanguage = false;
    }

    (query.stepperControls || '').split(',').forEach(function (controlStr) {
        // No prefix to highlight, '-' to disable.
        const m = /^([-_])?(.*)$/.exec(controlStr);
        if (m) {
            state.options.controls[m[2]] = m[1] || '+';
        }
    });
    if ('noStepper' in query) {
        state.options.showStepper = false;
        state.options.showStack = false;
        state.options.showViews = false;
        state.options.showIO = false;
    }
    if ('noStack' in query) {
        state.options.showStack = false;
    }
    if ('noViews' in query) {
        state.options.showViews = false;
    }
    if ('noIO' in query) {
        state.options.showIO = false;
    }
    if ('noMenu' in query) {
        state.options.showMenu = false;
    }
    if ('noDoc' in query) {
        state.options.showDocumentation = false;
    }
    if ('noFullScreen' in query) {
        state.options.showFullScreen = false;
    }
    if ('record' in query) {
        state.options.canRecord = true;
    }
    if ('platform' in query) {
        state.options.platform = query.platform;
        state.options.canChangePlatform = false;
    }
    if ('source' in query) {
        state.options.source = query.source || '';
    }
    if ('input' in query) {
        state.options.input = query.input || '';
    }
    if ('level' in query) {
        state.options.level = query.level || null;
    }
    if ('theme' in query) {
        state.options.theme = query.theme || null;
    }
    if ('directives' in query) {
        options.showDirectives = true;
    }

    if (query.recording) {
        state.options.baseDataUrl = query.recording;
        state.options.audioUrl = `${options.baseDataUrl}.mp3`;
        const {s3Bucket: bucket, uploadPath: folder, id: codecast} = parseCodecastUrl(options.baseDataUrl);
        state.options.codecastData = {bucket, folder, codecast};
        if (query.mode === 'edit') {
            state.options.mode = CodecastOptionsMode.Edit;
        } else {
            state.options.mode = CodecastOptionsMode.Play;
        }
    }
}

function appInitReducer(state: AppStore, {payload: {options, query}}) {
    state.options = options;
    if (!query || options.disableQueryOptions) {
        return;
    }

    loadOptionsFromQuery(options, query);
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, appInitReducer);

    bundle.defineAction(ActionTypes.PlatformChanged);
    bundle.addReducer(ActionTypes.PlatformChanged, (state, {payload: platform}) => {
        state.options.platform = platform;
        state.compile = {...initialStateCompile};
    });

    bundle.addSaga(function* () {
        yield* takeEvery(ActionTypes.PlatformChanged, function* () {
            yield* put({type: StepperActionTypes.StepperExit});
        });
    });
}
