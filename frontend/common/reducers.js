
import {addReducer} from '../utils/linker';
import Document from '../utils/document';

export default function* () {

  yield addReducer('switchToScreen', function (state, action) {
    return state.set('screen', action.screen);
  });

  yield addReducer('sourceInit', function (state, action) {
    return state.setIn(['source', 'editor'], action.editor);
  });

  yield addReducer('sourceEdit', function (state, action) {
    const prevSource = state.getIn(['source', 'document']);
    const source = Document.applyDelta(prevSource, action.delta);
    return state.setIn(['source', 'document'], source);
  });

  yield addReducer('sourceSelect', function (state, action) {
    return state.setIn(['source', 'selection'], action.selection);
  });

  yield addReducer('sourceScroll', function (state, action) {
    return state.setIn(['source', 'scrollTop'], action.scrollTop);
  });

  yield addReducer('inputInit', function (state, action) {
    return state.setIn(['input', 'editor'], action.editor);
  });

  yield addReducer('inputEdit', function (state, action) {
    const prevInput = state.getIn(['input', 'document']);
    const input = Document.applyDelta(prevInput, action.delta);
    return state.setIn(['input', 'document'], input);
  });

  yield addReducer('inputSelect', function (state, action) {
    return state.setIn(['input', 'selection'], action.selection);
  });

  yield addReducer('inputScroll', function (state, action) {
    return state.setIn(['input', 'scrollTop'], action.scrollTop);
  });

};
