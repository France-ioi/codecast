/**
  The "common" component contains elements common to all three modes
  (recorder, player, sandbox).
*/

import {defineAction, include} from '../utils/linker';

import MainView from './main_view';
import fullscreen  from './fullscreen';
import buffers from '../buffers/index';
import errors from './errors';

export default function* () {

  // Sent when the application initializes.
  yield defineAction('init', 'System.Init')

  yield include(MainView);
  yield include(fullscreen);
  yield include(buffers);
  yield include(errors);

};
