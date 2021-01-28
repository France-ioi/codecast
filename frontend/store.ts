import {Store} from "redux";
import {initialStateMemoryUsage} from "./recorder/memory_usage";
import {initialStateEditor} from "./editor";
import {initialStateStatistics} from "./statistics";
import {initialStateFullscreen} from "./common/fullscreen";
import {Error, initialStateError} from "./common/error";
import {mainViewGeometries} from "./common/resize";
import {Languages} from './lang';
import {initialStateStepper, StepperTask} from "./stepper";
import {initialStateCompile} from "./stepper/compile";
import {initialStateExamples} from "./common/examples";
import {initialStateUser} from "./common/login";
import {initialStateScreen} from "./common/screens";
import {initialStatePlayer} from "./player/reducers";
import {initialStateRecorder} from "./recorder/store";
import {initialStateBuffers} from "./buffers";
import {initialStateArduino} from "./stepper/arduino";
import {initialStateIoPane} from "./stepper/io";
import {initialStateSubtitles} from "./subtitles";
import {initialStateSave} from "./recorder/save_screen";
import {initialStateTerminal} from "./stepper/io/terminal";

export type CodecastPlatform = 'python' | 'unix' | 'arduino';

export interface CodecastOptions {
    language: keyof typeof Languages,
    controls: {},
    platform: CodecastPlatform,
    baseUrl: string,
    callbackUrl: string,
    examplesUrl: string,
    baseDataUrl: string,
    canChangePlatform: boolean,
    authProviders: string[],
    referer: any,
    showIO: boolean,
    showStack: boolean,
    showStepper: boolean,
    showViews: boolean,
    user: typeof initialStateUser // TODO: Why is this in options AND in store.user and not only in store.user ?
    start: string,
    codecastData: {
        codecast: string,
        folder: string,
        bucket: string
    },
    origin: string
}

export interface AppStore extends Store {
    lastError: undefined | Error
    memoryUsage: typeof initialStateMemoryUsage,
    editor: typeof initialStateEditor,
    statistics: typeof initialStateStatistics,
    fullscreen: typeof initialStateFullscreen
    stepper: typeof initialStateStepper,
    stepperTask: StepperTask,
    compile: typeof initialStateCompile,
    examples: typeof initialStateExamples,
    user: typeof initialStateUser,
    screen: typeof initialStateScreen,
    player: typeof initialStatePlayer,
    recorder: typeof initialStateRecorder,
    buffers: typeof initialStateBuffers,
    arduino: typeof initialStateArduino,
    ioPane: typeof initialStateIoPane,
    subtitles: typeof initialStateSubtitles,
    save: typeof initialStateSave,
    terminal: typeof initialStateTerminal,
    vumeterElement: any,

    options: CodecastOptions,

    // TODO: Put the following in a "window" attribute instead of at the root of the store
    mainViewGeometry: typeof mainViewGeometries[0]
    panes: any[],
    windowWidth: number,
    windowHeight: number,
    containerWidth: number,
    viewportTooSmall: boolean

    // TODO: Function should not be inside the store.
    getMessage: Function;
}