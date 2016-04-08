
import Immutable from 'immutable';
import * as C from 'persistent-c';
import {TermBuffer} from 'epic-vt';

import Document from '../document';
import * as runtime from '../common/runtime';
import {getRangeFromOffsets} from '../common/translate';

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
              .setIn(['recorder', 'source'], Immutable.Map(action.source));
};

export function recordScreenSourceEdit (state, action) {
  const prevSource = state.getIn(['recorder', 'source', 'document']);
  const source = Document.applyDelta(prevSource, action.delta);
  return state.setIn(['recorder', 'source', 'document'], source);
};

export function recordScreenSourceSelect (state, action) {
  return state.setIn(['recorder', 'source', 'selection'], action.selection);
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
  const startTime = state.getIn(['recorder', 'startTime']);
  const {timestamp, payload} = action;
  const event = Immutable.List([timestamp - startTime | 0, ...payload]);
  return state.updateIn(['recorder', 'events'], events => events.push(event));
};

export function recordScreenStepperRestart (state, action) {
  const translated = action.result || state.getIn(['recorder', 'translated']);
  const decls = translated.syntaxTree[2];
  const context = {decls, builtins: runtime.builtins};
  let stepperState = C.start(context);
  stepperState.terminal = new TermBuffer();
  stepperState = stepIntoUserCode(stepperState);
  return state.update('recorder', recorder => updateSelection(recorder
    .set('translated', translated)
    .set('stepper', Immutable.Map({state: 'idle', display: stepperState}))));
};

export function recordScreenStepperExit (state, action) {
  return state.update('recorder', recorder => recorder
    .delete('translated')
    .delete('stepper'));
};

export function recordScreenStepperStep (state, action) {
  if (state.getIn(['recorder', 'stepper', 'state']) !== 'idle') {
    return state;
  } else {
    return state.updateIn(['recorder', 'stepper'], stepper => stepper
      .set('state', 'starting')
      .set('compute', stepper.get('display')));
  }
};

export function recordScreenStepperStart (state, action) {
  return state.setIn(['recorder', 'stepper', 'state'], 'running');
};

export function recordScreenStepperProgress (state, action) {
  // Copy the new state to the recording screen's state, so that
  // the view reflects the current progress.
  return state.update('recorder', recorder =>
    updateSelection(recorder.update('stepper', stepper => stepper
      .set('display', action.context.state))));
};

export function recordScreenStepperIdle (state, action) {
  // Copy stepper state into recording screen and clean up the stepper.
  state = recordScreenStepperProgress(state, action);
  return state.update('recorder', recorder =>
    updateSelection(recorder.set('stepper', Immutable.Map(
      {state: 'idle', display: action.context.state}))));
};

function stepIntoUserCode (stepperState) {
  while (stepperState.control && !stepperState.control.node[1].begin) {
    stepperState = C.step(stepperState, runtime.options);
  }
  return stepperState;
}

function updateSelection (recorderState) {
  const display = recorderState.getIn(['stepper', 'display']);
  const translated = recorderState.get('translated');
  if (!display || !translated) {
    return recorderState;
  }
  const {control} = display;
  let selection = null;
  if (!control || !control.node) {
    return recorderState;
  }
  const attrs = control.node[1];
  selection = getRangeFromOffsets(translated, attrs.begin, attrs.end);
  return recorderState.setIn(['source', 'selection'], selection);
}
