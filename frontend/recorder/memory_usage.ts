import {put, takeEvery} from 'redux-saga/effects';
import {buffers} from 'redux-saga';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export const initialStateMemoryUsage = {
    heapSize: 0
};

export default function(bundle) {
    bundle.defineAction(ActionTypes.MemoryUsageChanged);

    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        draft.memoryUsage = initialStateMemoryUsage;
    }));

    bundle.addReducer(ActionTypes.MemoryUsageChanged, produce((draft: AppStore, {payload}) => {
        draft.memoryUsage = payload;
    }));

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.RecorderPreparing, function* (action) {
            // @ts-ignore
            if (action.payload.progress === 'worker_ok') {
                // @ts-ignore
                const channel = action.payload.worker.listen('memoryUsage', buffers.sliding(1));
                // @ts-ignore
                yield takeEvery(channel, function* ({heapSize}) {
                    yield put({type: ActionTypes.MemoryUsageChanged, payload: {workerHeapSize: heapSize}});
                });
            }
        });
    });
};
