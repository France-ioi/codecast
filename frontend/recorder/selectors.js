
import Immutable from 'immutable';

import {getStepperState, getTranslateState} from '../stepper/selectors'

export * from '../common/selectors';
export * from '../stepper/selectors';

export function getHomeScreenState (state) {
  return state.get('home').get('screen');
};

export function getPreparedSource (state) {
  return state.getIn(['prepare', 'source']);
};

export function getPreparedInput (state) {
  return state.getIn(['prepare', 'input']);
};

export function getRecorderState (state) {
  return state.get('recorder', Immutable.Map());
};

export function getRecorderSourceEditor (state) {
  return state.getIn(['source', 'editor']);
};

export function getSaveState (state) {
  return state.get('save');
};

export function App (state, props) {
  const screen = state.get('screen');
  return {screen};
};

export function HomeScreen (state, props) {
  return {};
};

export function PrepareScreen (state, props) {
  const prepare = state.get('prepare');
  const source = prepare.get('source');
  const examples = prepare.get('examples');
  return {source, examples};
};

export function RecordScreen (state, props) {
  const recorder = state.get('recorder');
  const recorderState = recorder.get('state');
  const translate = getTranslateState(state);
  const diagnostics = translate && translate.get('diagnostics');
  const eventCount = recorder.get('events').count();
  const elapsed = recorder.get('elapsed');
  const stepper = getStepperState(state);
  const stepperState = stepper && stepper.get('state');
  const stepperDisplay = stepper && stepper.get('display');
  return {
    recorderState, eventCount, elapsed,
    diagnostics, stepperState, stepperDisplay
  };
};

export function SaveScreen (state, props) {
  const save = state.get('save')
  const result = {};
  ['audioUrl', 'eventsUrl', 'playerUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
    result[key] = save.get(key);
  })
  return result;
};
