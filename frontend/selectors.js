
import Immutable from 'immutable';

export function getHomeScreenState (state) {
  return state.get('home').get('screen');
};

export function getPreparedSource (state) {
  return state.getIn(['prepare', 'source']);
};

export function getRecorderState (state) {
  return state.get('recorder', Immutable.Map());
};

export function getStepperState (state) {
  return state.get('recorder').get('stepper');
};

export function getRecorderSourceEditor (state) {
  return state.getIn(['recorder', 'source', 'editor']);
};
