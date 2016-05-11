/**
  The "common" component contains elements common to all three modes
  (recorder, player, sandbox).
*/

import {include} from '../utils/linker';

import actions from './actions';
import selectors from './selectors';
import reducers from './reducers';
import sagas from './sagas';
import MainView from './main_view';
import fullscreen  from './fullscreen';

export default function* () {
  yield include(actions);
  yield include(selectors);
  yield include(reducers);
  yield include(sagas);
  yield include(MainView);
  yield include(fullscreen);
};
