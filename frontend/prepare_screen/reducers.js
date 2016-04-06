
import Immutable from 'immutable';

import Document from '../document';

export function prepareScreenSourceEdit (state, action) {
  const prevSource = state.getIn(['prepare', 'source', 'document']);
  const source = Document.applyDelta(prevSource, action.delta);
  return state.setIn(['prepare', 'source', 'document'], source);
};

export function prepareScreenSourceSelect (state, action) {
  return state.setIn(['prepare', 'source', 'selection'], action.selection);
};
