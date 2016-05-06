
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
  const isRecording = recorderState === 'recording';
  const translate = getTranslateState(state);
  const diagnostics = translate && translate.get('diagnostics');
  const stepper = getStepperState(state);
  const haveStepper = !!stepper;
  const stepperState = haveStepper && stepper.get('state');
  const stepperDisplay = haveStepper && stepper.get('display');
  const terminal = haveStepper && stepperDisplay.terminal;
  return {isRecording, diagnostics, haveStepper, terminal};
};

export function RecorderControls (state, props) {
  const recorder = state.get('recorder');
  const recorderState = recorder.get('state');
  const isRecording = recorderState === 'recording';
  const elapsed = Math.round(recorder.get('elapsed') / 1000) || 0;
  const eventCount = recorder.get('events').count();
  const stepper = getStepperState(state);
  const haveStepper = !!stepper;
  const stepperState = haveStepper && stepper.get('state');
  const isStepping = stepperState !== 'idle';
  const stepperDisplay = haveStepper && stepper.get('display');
  const {control} = stepperDisplay || {};
  const canStep = !!(!isStepping && control && control.node);
  return {isRecording, elapsed, eventCount, haveStepper, isStepping, canStep};
};

export function SaveScreen (state, props) {
  const save = state.get('save')
  const result = {};
  ['audioUrl', 'eventsUrl', 'playerUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
    result[key] = save.get(key);
  })
  return result;
};
