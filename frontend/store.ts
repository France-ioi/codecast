import {Action, Store} from "redux";
import {initialStateMemoryUsage} from "./recorder/memory_usage";
import {StatisticsState} from "./statistics";
import {initialStateFullscreen} from "./common/fullscreen";
import {Error} from "./common/error";
import {mainViewGeometries} from "./common/resize";
import {Languages} from './lang';
import {Stepper} from "./stepper";
import {initialStateCompile} from "./stepper/compile";
import {initialStateExamples} from "./common/examples";
import {initialStateUser} from "./common/login";
import {Screen} from "./common/screens";
import {initialStatePlayer} from "./player";
import {initialStateRecorder} from "./recorder/store";
import {initialStateArduino} from "./stepper/arduino";
import {initialStateIoPane} from "./stepper/io";
import {SubtitlesState} from "./subtitles";
import {initialStateSave} from "./recorder/save_screen";
import {initialStateTerminal} from "./stepper/io/terminal";
import {TaskLevelName, TaskState} from "./task/task_slice";
import {LayoutState} from "./task/layout/layout";
import {DocumentationState} from "./task/documentation_slice";
import {BufferState} from "./buffers";
import {EditorState} from "./editor";

export type CodecastPlatform = 'python' | 'unix' | 'arduino';

export enum CodecastOptionsMode {
    Edit = 'edit',
    Play = 'play',
}

export interface CodecastOptions {
    language: keyof typeof Languages,
    level: TaskLevelName,
    controls: {},
    platform: CodecastPlatform,
    baseUrl: string,
    callbackUrl: string,
    examplesUrl: string,
    audioUrl: string,
    baseDataUrl: string,
    audioWorkerUrl: string,
    data: any,
    mode: CodecastOptionsMode,
    canChangePlatform: boolean,
    canChangeLanguage: boolean,
    authProviders: string[],
    referer: any,
    showIO: boolean,
    showStack: boolean,
    showStepper: boolean,
    showViews: boolean,
    showDocumentation: boolean,
    showFullScreen: boolean,
    showMenu: boolean,
    canRecord: boolean,
    user: typeof initialStateUser // TODO: Why is this in options AND in store.user and not only in store.user ?
    start: string,
    codecastData: {
        codecast: string,
        folder: string,
        bucket: string
    },
    origin: string,
    task?: string,
    taskInstructions?: string,
    source?: string,
    input?: string,
    theme?: string,
}

export interface Panes {
    [key: string]: {
        view: string,
        editing: boolean,
        enabled: boolean,
        width: number,
        visible: boolean
    }
}

export interface AppStoreReplay {
    ioPane: typeof initialStateIoPane,
    arduino: typeof initialStateArduino,
    buffers: {[key: string]: BufferState},
    stepper: Stepper,
    compile: typeof initialStateCompile,
    task: TaskState,

    options: CodecastOptions,
    environment: string,

    stopped: boolean,
    layout: LayoutState,
}

export interface AppAction extends Action {
    payload?: any;
}

export interface AppStore extends Store, AppStoreReplay {
    lastError: undefined | Error,
    memoryUsage: typeof initialStateMemoryUsage,
    editor: EditorState,
    statistics: StatisticsState,
    fullscreen: typeof initialStateFullscreen,
    examples: typeof initialStateExamples,
    user: typeof initialStateUser,
    screen: Screen,
    player: typeof initialStatePlayer,
    recorder: typeof initialStateRecorder,
    subtitles: SubtitlesState,
    save: typeof initialStateSave,
    terminal: typeof initialStateTerminal,
    terminalElement: any,
    vumeterElement: any,
    task: TaskState,

    // TODO: Put the following in a "window" attribute instead of at the root of the store
    mainViewGeometry: typeof mainViewGeometries[0],
    panes: Panes,
    windowWidth: number,
    windowHeight: number,
    containerWidth: number,
    viewportTooSmall: boolean,

    documentation: DocumentationState,
}
