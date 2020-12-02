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

export function getCompileDiagnostics(state: AppStore) {
    return state.getIn(['compile', 'diagnosticsHtml']);
}

export function getSyntaxTree(state: AppStore) {
    return state.getIn(['compile', 'syntaxTree']);
}

function getCompileStatus(state: AppStore) {
    return state.getIn(['compile', 'status']);
}
