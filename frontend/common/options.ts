import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes as StepperActionTypes} from '../stepper/actionTypes';
import {Bundle} from "../linker";
import {put, takeEvery} from "typed-redux-saga";
import {AppStore, CodecastOptions, CodecastOptionsMode} from "../store";
import {Languages} from "../lang";
import {isLocalStorageEnabled} from "./utils";
import {appSelect} from '../hooks';
import {platformsList} from '../stepper/platforms';
import {IoMode} from '../stepper/io';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {bufferChangePlatform} from '../buffers/buffer_actions';
import url from 'url';

export function loadOptionsFromQuery(options: CodecastOptions, query) {
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

    if (query.stepperControls) {
        query.stepperControls.split(',').forEach(function (controlStr) {
            // No prefix to highlight, '-' to disable.
            const m = /^([-_])?(.*)$/.exec(controlStr);
            if (m) {
                if (!options.controls) {
                    options.controls = {};
                }
                options.controls[m[2]] = m[1] || '+';
            }
        });
    }

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
    if ('noSettings' in query) {
        options.hideSettings = true;
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
        options.levels = query.level.split(',') || null;
    }
    if ('variant' in query) {
        options.taskVariant = Number(query.variant) || null;
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
    if ('defaultLevel' in query) {
        options.defaultLevel = query.defaultLevel;
    }
    if ('noDownload' in query) {
        options.canDownload = false;
    }

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
    if ('randomizeTestsOrder' in query) {
        options.randomizeTestsOrder = true;
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

    if (!isInPlatform() && isLocalStorageEnabled() && window.localStorage.getItem('platform') && window.localStorage.getItem('platform') in platformsList) {
        state.options.platform = window.localStorage.getItem('platform') as CodecastPlatform;
    }

    if ('tralalere' === state.options.app) {
        state.options.logAttempts = true;
        state.options.allowExecutionOverBlocksLimit = true;
        state.options.randomizeTestsOrder = true;
    }

    loadOptionsFromQuery(options, query);

    // For backward compatibility
    // @ts-ignore
    if ('unix' === state.options.platform) {
        state.options.platform = CodecastPlatform.Cpp;
    }

    if (!(state.options.platform in platformsList)) {
        throw new Error("Unknown platform name: " + state.options.platform);
    }
}

function isInPlatform() {
    var hasPlatform = false;
    try {
        // @ts-ignore
        hasPlatform = (inIframe() && (typeof parent.TaskProxyManager !== 'undefined') && (typeof parent.generating == 'undefined' || parent.generating === true));
    } catch(ex) {
        // iframe from files:// url are considered cross-domain by Chrome
        const urlParameters = new URLSearchParams(window.location.search);
        if (location.protocol !== 'file:' && urlParameters.get('iframe') !== 'noApi') {
            hasPlatform = true;
        }
    }

    return hasPlatform;
}

function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return false;
    }
}

export function parseCodecastUrl(base) {
    const {hostname, pathname} = url.parse(base);
    const s3Bucket = hostname.replace('.s3.amazonaws.com', '');
    const idPos = pathname.lastIndexOf('/');
    const uploadPath = pathname.slice(1, idPos); // skip leading '/'
    const id = pathname.slice(idPos + 1);

    return {s3Bucket, uploadPath, id};
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

    bundle.defineAction(ActionTypes.TaskVariantChanged);
    bundle.addReducer(ActionTypes.TaskVariantChanged, (state, {payload: {variant}}) => {
        state.options.taskVariant = variant;
    });

    bundle.defineAction(ActionTypes.TabsEnabledChanged);
    bundle.addReducer(ActionTypes.TabsEnabledChanged, (state, {payload: {tabsEnabled}}) => {
        state.options.tabsEnabled = tabsEnabled;
    });

    bundle.defineAction(ActionTypes.LogAttemptsChanged);
    bundle.addReducer(ActionTypes.LogAttemptsChanged, (state, {payload: {logAttempts}}) => {
        state.options.logAttempts = logAttempts;
    });

    bundle.addSaga(function* () {
        // @ts-ignore
        yield* takeEvery(ActionTypes.PlatformChanged, function* ({payload: {reloadTask}}) {
            const state = yield* appSelect();
            const newPlatform = state.options.platform;
            if (isLocalStorageEnabled()) {
                window.localStorage.setItem('platform', newPlatform);
            }
            if (false !== reloadTask) {
                yield* put({type: StepperActionTypes.StepperExit});

                const activeBufferName = state.buffers.activeBufferName;
                if (!state.options.tabsEnabled && null !== activeBufferName) {
                    yield* put(bufferChangePlatform(activeBufferName, newPlatform));
                }
            }
        });
    });
}
