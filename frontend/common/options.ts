import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes as StepperActionTypes} from '../stepper/actionTypes';
import {ActionTypes as BufferActionTypes} from '../buffers/actionTypes';
import {Bundle} from "../linker";
import {put, select, takeEvery} from "typed-redux-saga";
import {AppStore, CodecastOptions, CodecastOptionsMode, CodecastPlatform} from "../store";
import {parseCodecastUrl} from "../../backend/options";
import {Languages} from "../lang";
import {taskLoad} from "../task";
import {platformSaveAnswer, TaskLevelName} from "../task/platform/platform_slice";

function loadOptionsFromQuery(options: CodecastOptions, query) {
    if ('language' in query) {
        options.language = query.language;
    }

    if ('sLocale' in query) {
        const locale = query.sLocale;
        for (let language of Object.keys(Languages)) {
            const [leftPart] = language.split('-');
            if (locale === leftPart) {
                options.language = language as keyof typeof Languages;
                break;
            }
        }
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
    if ('theme' in query) {
        options.theme = query.theme || null;
    }
    if ('directives' in query) {
        options.showDirectives = true;
    }
    options.canDownload = !('noDownload' in query);

    if (query.recording) {
        options.baseDataUrl = query.recording;
        options.audioUrl = `${options.baseDataUrl}.mp3`;
        const {s3Bucket: bucket, uploadPath: folder, id: codecast} = parseCodecastUrl(options.baseDataUrl);
        options.codecastData = {bucket, folder, codecast};
        if (query.mode === 'edit') {
            options.mode = CodecastOptionsMode.Edit;
        } else {
            options.mode = CodecastOptionsMode.Play;
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
            const newPlatform = yield* select((state: AppStore) => state.options.platform);
            if (CodecastPlatform.Blockly === newPlatform || CodecastPlatform.Scratch === newPlatform) {
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('platform', newPlatform);
                window.location.search = searchParams.toString();
            }
            yield* put({type: StepperActionTypes.StepperExit});
            yield* put({type: BufferActionTypes.BufferReset, buffer: 'source', model: null});
            const levels = yield* select((state: AppStore) => state.platform.levels);
            for (let level of Object.keys(levels)) {
                yield* put(platformSaveAnswer({level: level as TaskLevelName, answer: null}));
            }
            yield* put(taskLoad({reloadContext: true}));
        });
    });
}
