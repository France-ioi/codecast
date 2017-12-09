
import Immutable from 'immutable';

import saveScreenComponent from './save_screen';
import recorderActions from './actions';
import recorderStore from './store';
import recorderSagas from './sagas';
import RecorderControls from './controls';
import RecordScreen from './record_screen';
import RecorderAppBundle from './app_view';
import ScreensBundle from '../common/screens';
import MemoryUsageBundle from '../common/memory_usage';

export default function (bundle, deps) {

  bundle.addReducer('init', state =>
    state.set('recorder', Immutable.Map()));

  bundle.include(saveScreenComponent);
  bundle.include(recorderActions);
  bundle.include(recorderStore);
  bundle.include(recorderSagas);
  bundle.include(RecorderControls);
  bundle.include(RecordScreen);
  bundle.include(RecorderAppBundle);
  bundle.include(ScreensBundle);
  bundle.include(MemoryUsageBundle);

};
