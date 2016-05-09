
import actions from './actions';
import sagas from './sagas';
import HomeScreen from './view';

export default function (m) {
  m.include(actions);
  m.include(sagas);
  m.include(HomeScreen);
};
