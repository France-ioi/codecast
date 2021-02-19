import {AppStore} from '../store';
import {initialStateStepper, StepperState} from "./index";

export function getStepper(state: AppStore): typeof initialStateStepper{
    return state.stepper;
}

export function getCurrentStepperState(state: AppStore): StepperState {
    return state.stepper.currentStepperState;
}

export function isStepperInterrupting(state: AppStore) {
    return state.stepper.interrupting;
}
