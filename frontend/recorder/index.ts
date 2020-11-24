import {Map} from 'immutable';

import saveScreenComponent from './save_screen';
import recorderStore from './store';
import recorderSagas from './sagas';
import RecorderControls from './controls';
import RecordScreen from './record_screen';
import RecorderAppBundle from './app_view';
import MemoryUsageBundle from './memory_usage';
import VumeterBundle from './vumeter';
import ScreensBundle from '../common/screens';

export default function (bundle, deps) {

  bundle.addReducer('init', state =>
    state.set('recorder', Map()));

  bundle.include(saveScreenComponent);
  bundle.include(recorderStore);
  bundle.include(recorderSagas);
  bundle.include(RecorderControls);
  bundle.include(RecordScreen);
  bundle.include(RecorderAppBundle);
  bundle.include(MemoryUsageBundle);
  bundle.include(VumeterBundle);
  bundle.include(ScreensBundle);
};
