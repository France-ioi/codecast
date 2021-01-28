import {AppStore} from '../store';

export function getStepper(state: AppStore) {
    return state.stepper;
}

export function getCurrentStepperState(state: AppStore) {
    return state.stepper.currentStepperState;
}

export function isStepperInterrupting(state: AppStore) {
    return state.stepper.interrupting;
}

export function getCompileDiagnostics(state: AppStore) {
    return state.compile.diagnosticsHtml;
}

export function getSyntaxTree(state: AppStore) {
    return state.compile.syntaxTree;
}
