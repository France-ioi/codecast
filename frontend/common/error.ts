import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {AppStore} from "../store";
import {Bundle} from "../linker";

export interface Error {
    error: string,
    source: string,
    info: string
}

export const initialStateError = undefined;

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.lastError = initialStateError;
    });

    bundle.defineAction(ActionTypes.Error);
    bundle.addReducer(ActionTypes.Error, (state: AppStore, {payload}) => {
        console.log("GENERIC ERROR", payload);

        state.lastError = payload;
    });

    bundle.defineAction(ActionTypes.ErrorClear);
    bundle.addReducer(ActionTypes.ErrorClear, (state: AppStore) => {
        state.lastError = initialStateError;
    });
}
