
import Immutable from 'immutable';
import Document from '../document';

export function prepareScreenSourceEdit (state, action) {
  const prevSource = state.screens.getIn(['prepare', 'source']);
  const source = Document.applyDelta(prevSource, action.delta);
  return {
    ...state,
    screens: state.screens.setIn(['prepare', 'source'], source)
  };
};

export function prepareScreenSourceSelect (state, action) {
  return {
    ...state,
    screens: state.screens.setIn(['prepare', 'selection'], action.selection)
  };
};
