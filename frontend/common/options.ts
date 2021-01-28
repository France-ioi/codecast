import {clearStepper} from '../stepper';
import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import produce from "immer";

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft, {payload: {options}}) => {
        draft.options = options;
    }));

    bundle.defineAction(ActionTypes.PlatformChanged);
    bundle.addReducer(ActionTypes.PlatformChanged, produce((draft, {payload: platform}) => {
        draft.options.platform = platform;

        clearStepper(draft.stepper);

        draft.compile = initialStateCompile;
    }));
}
