import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import produce from "immer";
import {AppStore} from "../store";

export const initialStateError = {
    error: '',
    source: '',
    info: ''
}

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        draft.lastError = initialStateError;
    }));

    bundle.defineAction(ActionTypes.Error);
    bundle.addReducer(ActionTypes.Error, produce((draft: AppStore, {payload}) => {
        console.log("GENERIC ERROR", payload);

        draft.lastError = payload;
    }));

    bundle.defineAction(ActionTypes.ErrorClear);
    bundle.addReducer(ActionTypes.ErrorClear, produce((draft: AppStore) => {
        draft.lastError = initialStateError;
    }));
}
