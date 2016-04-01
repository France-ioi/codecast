
import Immutable from 'immutable';

export function recorderPreparing (state, action) {
  return {
    ...state,
    recorder: {
      state: 'preparing'
    }
  };
};

export function recorderReady (state, action) {
  const {source, worker, watcher} = action;
  return {
    ...state,
    recorder: {
      state: 'ready',
      source,
      worker,
      watcher
    }
  };
};

export function recorderStarted (state, action) {
  const {recorder} = state;
  const {startTime} = action;
  return {
    ...state,
    screen: 'recording',
    recorder: {
      ...recorder,
      state: 'recording',
      startTime,
      elapsed: 0,
      timeOffset: 0,
      lastEventTime: 0,
      events: Immutable.Stack(),
      segments: Immutable.Stack()
    },
    recordingScreen: {
      source: state.home.source,
      selection: state.home.selection
    }
  };
};

export function recorderStopping (state, action) {
  const {recorder} = state;
  /*
    TODO: assemble the recording?
    const duration = 0;
    const actions = [];
    const audioUrls = [];
    state.segments.forEach(function (segment) {
       duration += segment.duration;
       Array.prototype.push.apply(actions, segment.actions);
       audioUrls.push(segment.audioUrl);
    });
    var result = {
       duration:  duration,
       actions: actions,
       audioUrls: audioUrls
    };
    state.isRecording = false;
    state.isPaused = false;
    state.segments = undefined;
  */
  return {
    ...state,
    recorder: {
      ...recorder,
      state: 'stopping'
    }
  };
};

export function recorderStopped (state, action) {
  const {recorder} = state;
  return {
    ...state,
    screen: 'home',
    recordingScreen: undefined,
    recorder: undefined,
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
  const elems = [timestamp, ...payload];
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
