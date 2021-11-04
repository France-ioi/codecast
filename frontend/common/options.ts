import {initialStateCompile} from "../stepper/compile";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {ActionTypes as StepperActionTypes} from '../stepper/actionTypes';
import {Bundle} from "../linker";
import {put, takeEvery} from "redux-saga/effects";

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state, {payload: {options}}) => {
        state.options = options;
    });

    bundle.defineAction(ActionTypes.PlatformChanged);
    bundle.addReducer(ActionTypes.PlatformChanged, (state, {payload: platform}) => {
        state.options.platform = platform;
        state.compile = {...initialStateCompile};
    });

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.PlatformChanged, function* () {
            yield put({type: StepperActionTypes.StepperExit});
        });
    });
}
