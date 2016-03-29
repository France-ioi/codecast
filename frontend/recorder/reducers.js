
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
  return {
    ...state,
    screen: 'recording',
    recorder: {
      ...recorder,
      state: 'recording'
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
