/**
  The "common" component contains elements common to all three modes
  (recorder, player, sandbox).
*/

import {include} from '../utils/linker';

import actions from './actions';
import reducers from './reducers';
import sagas from './sagas';
import MainView from './main_view';
import fullscreen  from './fullscreen';
import buffers from './buffers';

export default function* () {
  yield include(actions);
  yield include(reducers);
  yield include(sagas);
  yield include(MainView);
  yield include(fullscreen);
  yield include(buffers);
};
