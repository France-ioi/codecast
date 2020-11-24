import {stepperClear} from '../stepper/index';
import {compileClearDiagnostics} from "../stepper/compile";

export default function (bundle) {
    bundle.defineAction('platformChanged', 'Platform.Changed');
    bundle.addReducer('init', initReducer);
    bundle.addReducer('platformChanged', platformChangedReducer);
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
