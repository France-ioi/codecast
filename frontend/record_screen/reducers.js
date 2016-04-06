
import Immutable from 'immutable';
import Document from '../document';

export function switchToRecordScreen (state, action) {
      // TODO: split off recorder / screens.recording into two actions.
  return {
    ...state,
    screen: 'record',
    screens: state.screens.set('record', Immutable.Map(action.init))
  };
};

export function recordScreenSourceEdit (state, action) {
  const prevSource = state.screens.getIn(['record', 'source']);
  const source = Document.applyDelta(prevSource, action.delta);
  return {
    ...state,
    screens: state.screens.setIn(['record', 'source'], source)
  };
};

export function recordScreenSourceSelect (state, action) {
  return {
    ...state,
    screens: state.screens.setIn(['record', 'selection'], action.selection)
  };
};
