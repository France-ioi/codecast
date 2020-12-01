import {stepperClear} from '../stepper/index';
import {compileClearDiagnostics} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';

export default function (bundle) {
    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    bundle.defineAction(ActionTypes.PlatformChanged);
    bundle.addReducer(ActionTypes.PlatformChanged, platformChangedReducer);
}

function initReducer(state, {payload: {options}}) {
    return state.set('options', options);
}

function platformChangedReducer(state, {payload: platform}) {
    let newOptions = state.update('options', options => {
        return {
            ...options,
            platform: platform
        };
    });

    newOptions = newOptions.update('stepper', stepperClear);
    newOptions = newOptions.update('compile', compile => compileClearDiagnostics(compile));

    return newOptions;
}
