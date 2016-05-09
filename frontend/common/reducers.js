
import Document from '../utils/document';

export default function (m) {

  m.reducer('switchToScreen', function (state, action) {
    return state.set('screen', action.screen);
  });

  m.reducer('sourceInit', function (state, action) {
    return state.setIn(['source', 'editor'], action.editor);
  });

  m.reducer('sourceEdit', function (state, action) {
    const prevSource = state.getIn(['source', 'document']);
    const source = Document.applyDelta(prevSource, action.delta);
    return state.setIn(['source', 'document'], source);
  });

  m.reducer('sourceSelect', function (state, action) {
    return state.setIn(['source', 'selection'], action.selection);
  });

  m.reducer('sourceScroll', function (state, action) {
    return state.setIn(['source', 'scrollTop'], action.scrollTop);
  });

  m.reducer('inputInit', function (state, action) {
    return state.setIn(['input', 'editor'], action.editor);
  });

  m.reducer('inputEdit', function (state, action) {
    const prevInput = state.getIn(['input', 'document']);
    const input = Document.applyDelta(prevInput, action.delta);
    return state.setIn(['input', 'document'], input);
  });

  m.reducer('inputSelect', function (state, action) {
    return state.setIn(['input', 'selection'], action.selection);
  });

  m.reducer('inputScroll', function (state, action) {
    return state.setIn(['input', 'scrollTop'], action.scrollTop);
  });

};
