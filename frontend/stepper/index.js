
import actions from './actions';
import selectors from './selectors';
import reducers from './reducers';
import sagas from './sagas';
import translate from './translate';
import StepperControls from './controls';
import views from '../views/index';
import TerminalInputBundle from './terminal_input';

export default function (bundle) {
  bundle.include(actions);
  bundle.include(selectors);
  bundle.include(reducers);
  bundle.include(sagas);
  bundle.include(translate);
  bundle.include(StepperControls);
  bundle.include(views);
  bundle.include(TerminalInputBundle);
};
