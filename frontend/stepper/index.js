
import {include} from '../utils/linker';

import actions from './actions';
import selectors from './selectors';
import reducers from './reducers';
import sagas from './sagas';
import translate from './translate';
import StepperControls from './controls';
import StackView from './stack_view';
import DirectivesPane from './directives_pane';

export default function* () {
  yield include(actions);
  yield include(selectors);
  yield include(reducers);
  yield include(sagas);
  yield include(translate);
  yield include(StepperControls);
  yield include(StackView);
  yield include(DirectivesPane);
};
