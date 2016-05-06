
import Document from './document';

export function switchToScreen (state, action) {
  return state.set('screen', action.screen);
};

export function sourceInit (state, action) {
  return state.setIn(['source', 'editor'], action.editor);
};

export function sourceEdit (state, action) {
  const prevSource = state.getIn(['source', 'document']);
  const source = Document.applyDelta(prevSource, action.delta);
  return state.setIn(['source', 'document'], source);
};

export function sourceSelect (state, action) {
  return state.setIn(['source', 'selection'], action.selection);
};

export function sourceScroll (state, action) {
  return state.setIn(['source', 'scrollTop'], action.scrollTop);
};

export function inputInit (state, action) {
  return state.setIn(['input', 'editor'], action.editor);
};

export function inputEdit (state, action) {
  const prevInput = state.getIn(['input', 'document']);
  const input = Document.applyDelta(prevInput, action.delta);
  return state.setIn(['input', 'document'], input);
};

export function inputSelect (state, action) {
  return state.setIn(['input', 'selection'], action.selection);
};

export function inputScroll (state, action) {
  return state.setIn(['input', 'scrollTop'], action.scrollTop);
};
