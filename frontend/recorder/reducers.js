
import Immutable from 'immutable';

export function recorderPreparing (state, action) {
  const {progress} = action;
  return {
    ...state,
    recorder: {
      state: 'preparing',
      progress
    }
  };
};

export function recorderReady (state, action) {
  const {audioContext, worker} = action;
  return {
    ...state,
    recorder: {
      state: 'ready',
      audioContext,
      worker,
    }
  };
};

export function recorderStarting (state, action) {
  const {recorder} = state;
  return {
    ...state,
    recorder: {
      ...recorder,
      state: 'starting'
    }
  };
};

export function recorderStarted (state, action) {
  const {recorder} = state;
  const {startTime} = action;
  return {
    ...state,
    recorder: {
      ...recorder,
      state: 'recording',
      startTime,
      elapsed: 0,
      timeOffset: 0,
      lastEventTime: 0,
      events: Immutable.List()
    }
  };
};

export function recorderStartFailed (state, action) {
  const {recorder} = state;
  return {
    ...state,
    recorder: {
      ...recorder,
      state: 'start_failed'
    }
  };
};

export function recorderStopping (state, action) {
  const {recorder} = state;
  return {
    ...state,
    recorder: {
      ...recorder,
      state: 'stopping'
    }
  };
};

export function recorderStopped (state, action) {
  const {audioContext, worker} = state.recorder;
  // XXX split off switch to home screen
  return {
    ...state,
    screen: 'home',
    recordingScreen: undefined,
    recorder: {
      state: 'ready',
      audioContext,
      worker
    },
    translated: undefined,
    stepper: undefined
  };
};

export function recorderTick (state, action) {
  const {recorder} = state;
  const {now} = action;
  return {
    ...state,
    recorder: {
      ...recorder,
      elapsed: now - recorder.startTime
    }
  };
};

export function recorderAddEvent (state, action) {
  const {recorder} = state;
  const {timestamp, payload} = action;
  const elems = [timestamp - recorder.startTime, ...payload];
  const event = Immutable.List(elems);
  return {
    ...state,
    recorder: {
      ...recorder,
      events: recorder.events.push(event)
    }
  };
};

export function recorderClearEvents (state, action) {
  const {recorder} = state;
  return {
    ...state,
    recorder: {
      ...recorder,
      events: Immutable.List()
    }
  };
};
