import {call, cancel, fork, takeEvery} from 'typed-redux-saga';
import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {delay} from '../player/sagas';

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.VumeterMounted);
    bundle.addReducer(ActionTypes.VumeterMounted, vumeterMountedReducer);

    bundle.addSaga(vumeterSaga);
};

function* vumeterSaga() {
    let vumeterTask;
    let canvasContext;
    let canvasWidth;
    let canvasHeight;
    let bandHeight = 12;

    // @ts-ignore
    yield* takeEvery(ActionTypes.VumeterMounted, function* ({payload: {element, width, height}}) {
        canvasContext = element && element.getContext("2d");
        canvasWidth = width;
        canvasHeight = height;
    });
    yield* takeEvery(ActionTypes.RecorderStopped, vumeterCleanupSaga);
    // @ts-ignore
    yield* takeEvery(ActionTypes.RecorderPreparing, function* ({payload: {analyser}}) {
        if (!analyser) return;
        yield* call(vumeterCleanupSaga);
        vumeterTask = yield* fork(vumeterMonitorSaga, analyser);
    });

    function* vumeterMonitorSaga(analyser) {
        const vumeterData = new Uint8Array(analyser.frequencyBinCount);
        // Set up the ScriptProcessor to divert all buffers to the worker.
        yield* call(periodically,function* () {
            // Get analyser data and update vumeter.
            analyser.getByteFrequencyData(vumeterData);
            let sum = 0, i;
            for (i = 0; i < vumeterData.length; i++) {
                sum += vumeterData[i];
            }
            const average = sum / vumeterData.length;
            canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
            if (average < 1) {
                canvasContext.fillStyle = '#e34e4e';
                canvasContext.font = '16px "Open Sans", sans-serif';
                canvasContext.fillText('Aucun son', 0, canvasHeight - 4);
            } else {
                canvasContext.fillStyle = '#5FE34E';
                canvasContext.fillRect(0, (canvasHeight - bandHeight) / 2, average * canvasWidth / 100,  bandHeight);
            }
        });
    }

    function* vumeterCleanupSaga() {
        if (vumeterTask) {
            yield* cancel(vumeterTask);
            vumeterTask = null;
        }
    }

    function* periodically(saga) {
        while (true) {
            if (canvasContext) {
                yield* call(saga);
            }
            yield* delay(100);
        }
    }
}

function vumeterMountedReducer(state: AppStore, {payload: {element}}): void {
    state.vumeterElement = element;
}
