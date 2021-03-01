import {clearStepper} from '../stepper';
import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {Bundle} from "../linker";

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state, {payload: {options}}) => {
        state.options = options;
    });

    bundle.defineAction(ActionTypes.PlatformChanged);
    bundle.addReducer(ActionTypes.PlatformChanged, (state, {payload: platform}) => {
        state.options.platform = platform;

        clearStepper(state.stepper);

        state.compile = initialStateCompile;
    });
}
