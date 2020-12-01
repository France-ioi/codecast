import {put, takeEvery} from 'redux-saga/effects';
import {buffers} from 'redux-saga';
import {MemoryUsage} from "./MemoryUsage";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";

export default function (bundle, deps) {
    bundle.use('recorderPreparing');
    bundle.defineAction(ActionTypes.MemoryUsageChanged);

    bundle.addReducer(AppActionTypes.AppInit, (state) => state.set('memoryUsage', {heapSize: 0}));
    bundle.addReducer(ActionTypes.MemoryUsageChanged, (state, {payload}) =>
        state.update('memoryUsage', (value => ({...value, ...payload}))));

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
