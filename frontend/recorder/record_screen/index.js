
import actions from './actions';
import reducers from './reducers';
import sagas from './sagas';
import RecorderControls from './controls_view';
import RecordScreen from './view';

export default function (m) {
  m.include(actions);
  m.include(reducers);
  m.include(sagas);
  m.include(RecordScreen);
  m.include(RecorderControls);
};

