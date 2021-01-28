import {call, cancel, delay, fork, takeEvery} from 'redux-saga/effects';
import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export default function(bundle) {
    bundle.defineAction(ActionTypes.VumeterMounted);
    bundle.addReducer(ActionTypes.VumeterMounted, produce(vumeterMountedReducer));

    bundle.addSaga(vumeterSaga);
};

function* vumeterSaga() {
    let vumeterTask;
    let canvasContext;

    // @ts-ignore
    yield takeEvery(ActionTypes.VumeterMounted, function* ({payload: {element}}) {
        canvasContext = element && element.getContext("2d");
    });
    yield takeEvery(ActionTypes.RecorderStopped, vumeterCleanupSaga);
    // @ts-ignore
    yield takeEvery(ActionTypes.RecorderPreparing, function* ({payload: {analyser}}) {
        if (!analyser) return;
        yield call(vumeterCleanupSaga);
        vumeterTask = yield fork(vumeterMonitorSaga, analyser);
    });

    function* vumeterMonitorSaga(analyser) {
        const vumeterData = new Uint8Array(analyser.frequencyBinCount);
        // Set up the ScriptProcessor to divert all buffers to the worker.
        periodically(function* () {
            // Get analyser data and update vumeter.
            analyser.getByteFrequencyData(vumeterData);
            let sum = 0, i;
            for (i = 0; i < vumeterData.length; i++) {
                sum += vumeterData[i];
            }
            const average = sum / vumeterData.length;
            canvasContext.fillStyle = '#dddddd';
            canvasContext.fillRect(0, 0, 10, 100);
            canvasContext.fillStyle = '#00ff00';
            canvasContext.fillRect(0, 100 - average, 10, 100);
        });
    }

    function* vumeterCleanupSaga() {
        if (vumeterTask) {
            yield cancel(vumeterTask);
            vumeterTask = null;
        }
    }

    function* periodically(saga) {
        while (true) {
            if (canvasContext) {
                yield call(saga);
            }
            yield delay(100);
        }
    }
}

function vumeterMountedReducer(draft: AppStore, {payload: {element}}): void {
    draft.vumeterElement = element;
}
