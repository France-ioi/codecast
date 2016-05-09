
import Immutable from 'immutable';

export default function (m) {

  const {getStepperState} = m.selectors;

  m.selector('getHomeScreenState', state =>
    state.get('home').get('screen')
  );

  m.selector('getPreparedSource', state =>
    state.getIn(['prepare', 'source'])
  );

  m.selector('getPreparedInput', state =>
    state.getIn(['prepare', 'input'])
  );

  m.selector('getRecorderState', state =>
    state.get('recorder', Immutable.Map())
  );

  m.selector('getRecorderSourceEditor', state =>
    state.getIn(['source', 'editor'])
  );

  m.selector('getSaveState', state =>
    state.get('save')
  );

  m.selector('App', function (state, props) {
    const screen = state.get('screen');
    return {screen};
  });

  m.selector('HomeScreen', function (state, props) {
    return {};
  });

  m.selector('PrepareScreen', function (state, props) {
    const prepare = state.get('prepare');
    const source = prepare.get('source');
    const examples = prepare.get('examples');
    return {source, examples};
  });

  m.selector('RecorderControls', function (state, props) {
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
  });

  m.selector('SaveScreen', function (state, props) {
    const save = state.get('save')
    const result = {};
    ['audioUrl', 'eventsUrl', 'playerUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
      result[key] = save.get(key);
    })
    return result;
  });

};
