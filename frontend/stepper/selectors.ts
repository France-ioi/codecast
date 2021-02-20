import {AppStore, AppStoreReplay} from '../store';
import {initialStateStepper, StepperState} from "./index";

export function getStepper(state: AppStore): typeof initialStateStepper{
    return state.stepper;
}

export function getCurrentStepperState(state: AppStoreReplay): StepperState {
    return state.stepper.currentStepperState;
}

export function isStepperInterrupting(state: AppStore) {
    return state.stepper.interrupting;
}
