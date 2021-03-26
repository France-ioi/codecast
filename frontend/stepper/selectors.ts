import {AppStore, AppStoreReplay} from '../store';
import {Stepper, StepperState} from "./index";

export function getStepper(state: AppStore): Stepper {
    return state.stepper;
}

export function getCurrentStepperState(state: AppStoreReplay): StepperState {
    return state.stepper.currentStepperState;
}

export function isStepperInterrupting(state: AppStore): boolean {
    return state.stepper.interrupting;
}
