import {List} from 'immutable';
import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore} from "../store";

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

export default function(bundle) {
    bundle.defineAction(ActionTypes.RecorderPreparing);
    bundle.addReducer(ActionTypes.RecorderPreparing, produce((draft: AppStore, action) => {
        const {progress} = action;

        draft.recorder.status = RecorderStatus.Preparing;
        draft.recorder.progress = progress;
    }));

    bundle.defineAction(ActionTypes.RecorderReady);
    bundle.addReducer(ActionTypes.RecorderReady, produce((draft: AppStore, {payload: {recorderContext}}) => {
        draft.recorder.status = RecorderStatus.Ready;
        draft.recorder.context = recorderContext;
        draft.recorder.junkTime = 0;
    }));

    bundle.defineAction(ActionTypes.RecorderStarting);
    bundle.addReducer(ActionTypes.RecorderStarting, produce((draft: AppStore) => {
        draft.recorder.status = RecorderStatus.Starting;
    }));

    bundle.defineAction(ActionTypes.RecorderStarted);
    bundle.addReducer(ActionTypes.RecorderStarted, produce((draft: AppStore) => {
        draft.recorder.status = RecorderStatus.Recording;
        draft.recorder.timeOffset = 0;
        draft.recorder.lastEventTime = 0;
        draft.recorder.events = [];
        draft.recorder.elapsed = 0;
    }));

    bundle.defineAction(ActionTypes.RecorderStartFailed);
    bundle.addReducer(ActionTypes.RecorderStartFailed, produce((draft: AppStore) => {
        draft.recorder.status = RecorderStatus.StartFailed;
    }));

    bundle.defineAction(ActionTypes.RecorderStopping);
    bundle.addReducer(ActionTypes.RecorderStopping, produce((draft: AppStore) => {
        draft.recorder.status = RecorderStatus.Stopping;
    }));

    bundle.defineAction(ActionTypes.RecorderStopped);
    bundle.addReducer(ActionTypes.RecorderStopped, produce((draft: AppStore) => {
        draft.recorder.status = RecorderStatus.Stopped;
    }));

    bundle.defineAction(ActionTypes.RecorderPausing);
    bundle.addReducer(ActionTypes.RecorderPausing, produce((draft: AppStore) => {
        draft.recorder.status = RecorderStatus.Pausing;
    }));

    bundle.defineAction(ActionTypes.RecorderPaused);
    bundle.addReducer(ActionTypes.RecorderPaused, produce((draft: AppStore) => {
        draft.recorder.status = RecorderStatus.Paused;
    }));

    bundle.defineAction(ActionTypes.RecorderTick);
    bundle.addReducer(ActionTypes.RecorderTick, produce((draft: AppStore, action) => {
        const {elapsed} = action;

        draft.recorder.elapsed = elapsed;
    }));
};
