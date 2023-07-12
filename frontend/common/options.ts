import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes as StepperActionTypes} from '../stepper/actionTypes';
import {Bundle} from "../linker";
import {put, takeEvery} from "typed-redux-saga";
import {AppStore, CodecastOptions, CodecastOptionsMode} from "../store";
import {parseCodecastUrl} from "../../backend/options";
import {Languages} from "../lang";
import {platformSaveAnswer, TaskLevelName} from "../task/platform/platform_slice";
import {isLocalStorageEnabled} from "./utils";
import {appSelect} from '../hooks';
import {platformsList} from '../stepper/platforms';
import {IoMode} from '../stepper/io';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {taskLoad} from '../task/task_actions';
import {
    createEmptyBufferState,
    getBufferTypeFromPlatform
} from '../buffers/document';
import {bufferReset} from '../buffers/buffers_slice';

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
    if ('viewTestDetails' in query) {
        options.viewTestDetails = true;
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

    if ('log' in query) {
        options.logAttempts = true;
    }
    if ('allowExecutionOverBlocksLimit' in query) {
        options.allowExecutionOverBlocksLimit = true;
    }
    if ('ioMode' in query && 'split' === query.ioMode) {
        options.ioMode = IoMode.Split;
    }
}

function appInitReducer(state: AppStore, {payload: {options, query}}) {
    state.options = options;
    if (!options.ioMode) {
        options.ioMode = IoMode.Terminal;
    }
    if (!query || options.disableQueryOptions) {
        return;
    }

    if (isLocalStorageEnabled() && window.localStorage.getItem('platform')) {
        state.options.platform = window.localStorage.getItem('platform') as CodecastPlatform;
    }

    if ('tralalere' === state.options.app) {
        state.options.logAttempts = true;
        state.options.allowExecutionOverBlocksLimit = true;
    }

    loadOptionsFromQuery(options, query);

    if (!(state.options.platform in platformsList)) {
        throw new Error("Unknown platform name: " + state.options.platform);
    }
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, appInitReducer);

    bundle.defineAction(ActionTypes.PlatformChanged);
    bundle.addReducer(ActionTypes.PlatformChanged, (state, {payload: {platform}}) => {
        state.options.platform = platform;
        state.compile = {...initialStateCompile};
    });

    bundle.defineAction(ActionTypes.CanChangePlatformChanged);
    bundle.addReducer(ActionTypes.CanChangePlatformChanged, (state, {payload: {canChangePlatform}}) => {
        state.options.canChangePlatform = canChangePlatform;
    });

    bundle.addSaga(function* () {
        // @ts-ignore
        yield* takeEvery(ActionTypes.PlatformChanged, function* ({payload: {reloadTask}}) {
            const newPlatform = yield* appSelect(state => state.options.platform);
            if (isLocalStorageEnabled()) {
                window.localStorage.setItem('platform', newPlatform);
            }
            if (false !== reloadTask) {
                yield* put({type: StepperActionTypes.StepperExit});

                // Reset source if we change from a block platform to a non-block platform
                const currentModel = yield* appSelect(state => state.buffers['source']);
                if (currentModel.type !== getBufferTypeFromPlatform(newPlatform)) {
                    const newModel = createEmptyBufferState(getBufferTypeFromPlatform(newPlatform));
                    yield* put(bufferReset({buffer: 'source', state: newModel}));
                }

                const levels = yield* appSelect(state => state.platform.levels);
                for (let level of Object.keys(levels)) {
                    yield* put(platformSaveAnswer({level: level as TaskLevelName, answer: null}));
                }
                yield* put(taskLoad({reloadContext: true}));
            }
        });
    });
}
