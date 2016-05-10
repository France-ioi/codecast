
import actions from './actions';
import selectors from './selectors'
import reducers from './reducers';
import sagas from './sagas';
import RecorderControls from './controls_view';
import RecordScreen from './view';

export default function (m) {
  m.include(actions);
  m.include(selectors);
  m.include(reducers);
  m.include(sagas);
  m.include(RecordScreen);
  m.include(RecorderControls);
};

