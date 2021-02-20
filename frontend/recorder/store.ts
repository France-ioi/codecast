import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";

/*

  shape of state.recorder:
  {
    status: /preparing|ready|starting|start_failed|stopping/,
    timeOffset,
    lastEventTime,
    events: [[timestamp, ...payload]],
    elapsed
  }

*/

export enum RecorderStatus {
    Preparing = 'preparing',
    Ready = 'ready',
    Starting = 'starting',
    StartFailed = 'start_failed',
    Stopping = 'stopping',
    Stopped = 'stopped',
    Pausing = 'pausing',
    Paused = 'paused',
    Recording = 'recording',
    Resuming = 'resuming'
}

export const initialStateRecorder = {
    progress: 0,
    status: null as RecorderStatus,
    context: null as any, // TODO: type
    junkTime: 0,
    elapsed: 0,
    suspendedAt: 0,
    timeOffset: 0,
    lastEventTime: 0,
    events: [] as any[] // TODO: type
}

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.RecorderPreparing);
    bundle.addReducer(ActionTypes.RecorderPreparing, (state: AppStore, action) => {
        const {progress} = action;

        state.recorder.status = RecorderStatus.Preparing;
        state.recorder.progress = progress;
    });

    bundle.defineAction(ActionTypes.RecorderReady);
    bundle.addReducer(ActionTypes.RecorderReady, (state: AppStore, {payload: {recorderContext}}) => {
        state.recorder.status = RecorderStatus.Ready;
        state.recorder.context = recorderContext;
        state.recorder.junkTime = 0;
    });

    bundle.defineAction(ActionTypes.RecorderStarting);
    bundle.addReducer(ActionTypes.RecorderStarting, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Starting;
    });

    bundle.defineAction(ActionTypes.RecorderStarted);
    bundle.addReducer(ActionTypes.RecorderStarted, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Recording;
        state.recorder.timeOffset = 0;
        state.recorder.lastEventTime = 0;
        state.recorder.events = [];
        state.recorder.elapsed = 0;
    });

    bundle.defineAction(ActionTypes.RecorderStartFailed);
    bundle.addReducer(ActionTypes.RecorderStartFailed, (state: AppStore) => {
        state.recorder.status = RecorderStatus.StartFailed;
    });

    bundle.defineAction(ActionTypes.RecorderStopping);
    bundle.addReducer(ActionTypes.RecorderStopping, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Stopping;
    });

    bundle.defineAction(ActionTypes.RecorderStopped);
    bundle.addReducer(ActionTypes.RecorderStopped, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Stopped;
    });

    bundle.defineAction(ActionTypes.RecorderPausing);
    bundle.addReducer(ActionTypes.RecorderPausing, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Pausing;
    });

    bundle.defineAction(ActionTypes.RecorderPaused);
    bundle.addReducer(ActionTypes.RecorderPaused, (state: AppStore) => {
        state.recorder.status = RecorderStatus.Paused;
    });

    bundle.defineAction(ActionTypes.RecorderTick);
    bundle.addReducer(ActionTypes.RecorderTick, (state: AppStore, action) => {
        const {elapsed} = action;

        state.recorder.elapsed = elapsed;
    });
};
