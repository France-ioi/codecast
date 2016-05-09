/**
  The "common" component contains elements common to all three modes
  (recorder, player, sandbox).
*/

import actions from './actions';
import selectors from './selectors';
import reducers from './reducers';
import sagas from './sagas';
import MainView from './main_view';

export default function (m) {
  m.include(actions);
  m.include(selectors);
  m.include(reducers);
  m.include(sagas);
  m.include(MainView);
};
