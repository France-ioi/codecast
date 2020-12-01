import {ActionTypes} from "./actionTypes";
import {AppErrorBoundary} from "./AppErrorBoundary";

export default function (bundle) {
    bundle.defineAction(ActionTypes.Error);
    bundle.addReducer(ActionTypes.Error, errorReducer);

    bundle.defineAction(ActionTypes.ErrorClear);
    bundle.addReducer(ActionTypes.ErrorClear, clearErrorReducer);
}

function errorReducer(state, {payload}) {
    console.log("GENERIC ERROR", payload);

    return state.set('lastError', payload);
}

function clearErrorReducer(state, _action) {
    return state.set('lastError', undefined);
}
