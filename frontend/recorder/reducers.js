
import Immutable from 'immutable';

import Document from '../common/document';

/*

  shape of state.recorder:
  {
    state(/preparing|ready|starting|start_failed|stopping/),
    source: {document, selection},
    stepper: {state, compute, display},
    startTime,
    timeOffset,
    lastEventTime,
    events: [[timestamp, ...payload]],
    elapsed
  }

*/

export function switchToRecordScreen (state, action) {
  return state.set('screen', 'record')
              .setIn(['recorder', 'source'], Immutable.Map(action.source))
              .setIn(['recorder', 'input'], Immutable.Map(action.input));
};

export function recordScreenSourceInit (state, action) {
  return state.setIn(['recorder', 'source', 'editor'], action.editor);
};

export function recordScreenSourceEdit (state, action) {
  const prevSource = state.getIn(['recorder', 'source', 'document']);
  const source = Document.applyDelta(prevSource, action.delta);
  return state.setIn(['recorder', 'source', 'document'], source);
};

export function recordScreenSourceSelect (state, action) {
  return state.setIn(['recorder', 'source', 'selection'], action.selection);
};

export function recordScreenInputInit (state, action) {
  return state.setIn(['recorder', 'input', 'editor'], action.editor);
};

export function recordScreenInputEdit (state, action) {
  const prevInput = state.getIn(['recorder', 'input', 'document']);
  const input = Document.applyDelta(prevInput, action.delta);
  return state.setIn(['recorder', 'input', 'document'], input);
};

export function recordScreenInputSelect (state, action) {
  return state.setIn(['recorder', 'input', 'selection'], action.selection);
};

export function recorderPreparing (state, action) {
  const {progress} = action;
  return state.set('recorder', Immutable.Map({state: 'preparing', progress}));
};

export function recorderReady (state, action) {
  const {context} = action;
  return state.set('recorder', Immutable.Map({state: 'ready', context: Immutable.Map(context)}));
};

export function recorderStarting (state, action) {
  return state.setIn(['recorder', 'state'], 'starting');
};

export function recorderStarted (state, action) {
  const {recorder} = state;
  const {startTime} = action;
  return state.update('recorder', recorder => recorder
    .set('state', 'recording')
    .set('startTime', startTime)
    .set('timeOffset', 0)
    .set('lastEventTime', 0)
    .set('events', Immutable.List()))
    .set('elapsed', 0);
};

export function recorderStartFailed (state, action) {
  return state.setIn(['recorder', 'state'], 'start_failed');
};

export function recorderStopping (state, action) {
  return state.setIn(['recorder', 'state'], 'stopping');
};

export function recorderStopped (state, action) {
  // Clear the recorder state, keeping its context.
  const context = state.getIn(['recorder', 'context']);
  return state
    .set('recorder', Immutable.Map({state: 'ready', context}))
    .set('screen', 'save')
    .set('save', Immutable.Map({
      audioUrl: action.audioUrl,
      eventsUrl: action.eventsUrl
    }));
};

export function recorderTick (state, action) {
  const startTime = state.getIn(['recorder', 'startTime']);
  const elapsed = action.now - startTime;
  return state.setIn(['recorder', 'elapsed'], elapsed);
};

export function recorderAddEvent (state, action) {
  const audioContext = state.getIn(['recorder', 'context', 'audioContext']);
  const event = Immutable.List([Math.round(audioContext.currentTime * 1000), ...action.payload]);
  return state.updateIn(['recorder', 'events'], events => events.push(event));
};

export function recordScreenStepperRestart (state, action) {
  const stepperState = action.stepperState || state.getIn(['recorder', 'stepper', 'initial']);
  console.log("recordScreenStepperRestart", stepperState);
  return state
    .update('recorder', recorder => recorder
      .set('stepper', Immutable.Map({state: 'idle', initial: stepperState, display: stepperState})));
};

export function recordScreenStepperExit (state, action) {
  return state.update('recorder', recorder => recorder
    .delete('stepper')
    .delete('translate'));
};

export function recordScreenStepperStep (state, action) {
  if (state.getIn(['recorder', 'stepper', 'state']) !== 'idle') {
    return state;
  } else {
    return state.updateIn(['recorder', 'stepper'], stepper => stepper
      .set('state', 'starting')
      .set('current', stepper.get('display')));
  }
};

export function recordScreenStepperStart (state, action) {
  return state.setIn(['recorder', 'stepper', 'state'], 'running');
};

export function recordScreenStepperProgress (state, action) {
  // Copy the new state to the recording screen's state, so that
  // the view reflects the current progress.
  return state.setIn(['recorder', 'stepper', 'display'], action.context.state);
};

export function recordScreenStepperIdle (state, action) {
  // Copy stepper state into recording screen and clean up the stepper.
  state = recordScreenStepperProgress(state, action);
  return state.setIn(['recorder', 'stepper', 'state'], 'idle');
};

export function translateSourceSucceeded (state, action) {
  const {diagnostics} = action;
  return state
    .setIn(['recorder', 'translate'], Immutable.Map({diagnostics}));
};

export function translateSourceFailed (state, action) {
  const {error, diagnostics} = action;
  return state
    .setIn(['recorder', 'translate'], Immutable.Map({error, diagnostics}));
};
