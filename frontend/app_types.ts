import {AppStore, CodecastOptions} from './store';
import {RecordApi} from './recorder/record';
import {ReplayApi} from './player/replay';
import {StepperApi} from './stepper/api';
import AbstractRunner from './stepper/abstract_runner';

export interface CodecastEnvironmentMonitoring {
    effectTriggered: Function,
    effectResolved: Function,
    effectRejected: Function,
    effectCancelled: Function,
    clearListeners: Function,
}

export interface CodecastEnvironment {
    store: AppStore,
    restart: Function,
    monitoring: CodecastEnvironmentMonitoring,
}

export interface App {
    recordApi: RecordApi,
    replayApi: ReplayApi,
    stepperApi: StepperApi,
    dispatch: Function,
    environment: string,
}

export interface CodecastType {
    options?: CodecastOptions,
    environments: { [key: string]: CodecastEnvironment },
    start?: Function,
    restartSagas?: Function,
    runner?: AbstractRunner,
}

window.Codecast = {
    environments: {},
}

export const Codecast: CodecastType = window.Codecast;
