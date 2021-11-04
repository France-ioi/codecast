import {put, takeEvery} from 'redux-saga/effects';
import {buffers} from 'redux-saga';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";

export const initialStateMemoryUsage = {
    heapSize: 0
};

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.MemoryUsageChanged);

    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.memoryUsage = {...initialStateMemoryUsage};
    });

    bundle.addReducer(ActionTypes.MemoryUsageChanged, (state: AppStore, {payload}) => {
        state.memoryUsage.heapSize = payload.heapSize;
    });

    bundle.addSaga(function* () {
        yield takeEvery(ActionTypes.RecorderPreparing, function* (action) {
            // @ts-ignore
            if (action.payload.progress === 'worker_ok') {
                // @ts-ignore
                const channel = action.payload.worker.listen('memoryUsage', buffers.sliding(1));
                // @ts-ignore
                yield takeEvery(channel, function* (action) {
                    yield put({
                        type: ActionTypes.MemoryUsageChanged,
                        payload: {
                            // @ts-ignore
                            heapSize: action.payload
                        }
                    });
                });
            }
        });
    });
}
