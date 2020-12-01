import {AppStore} from '../store';

export function getStepper(state: AppStore) {
    return state.get('stepper')
}

export function getCurrentStepperState(state: AppStore) {
    return state.getIn(['stepper', 'currentStepperState']);
}

export function isStepperInterrupting(state: AppStore) {
    return state.getIn(['stepper', 'interrupting'], false);
}
