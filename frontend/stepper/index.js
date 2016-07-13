
import {include} from '../utils/linker';

import actions from './actions';
import selectors from './selectors';
import reducers from './reducers';
import sagas from './sagas';
import translate from './translate';
import StepperControls from './controls';
import views from '../views/index';

export default function* () {
  yield include(actions);
  yield include(selectors);
  yield include(reducers);
  yield include(sagas);
  yield include(translate);
  yield include(StepperControls);
  yield include(views);
};
