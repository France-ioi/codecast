
import actions from './actions';
import selectors from './selectors';
import reducers from './reducers';
import sagas from './sagas';
import StackView from './stack_view';
import DirectivesPane from './directives_pane';

export default function (m) {
  m.include(actions);
  m.include(selectors);
  m.include(reducers);
  m.include(sagas);
  m.include(StackView);
  m.include(DirectivesPane);
};
