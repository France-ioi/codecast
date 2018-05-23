/**
  The "common" bundle contains elements common to all applications
  (sandbox, player, recorder, editor).
*/

import replayBundle from '../player/replay';
import recordBundle from '../recorder/record';
import langBundle from '../lang/index';
import buffersBundle from '../buffers';
import stepperBundle from '../stepper';
import optionsBundle from './options';
import mainViewBundle from './main_view';
import mainViewPanesBundle from './main_view_panes';
import resizeBundle from './resize';
import fullscreenBundle from './fullscreen';
import menuBundle from './menu';
import loginBundle from './login';
import clientApiBundle from './client_api';
import subtitlesBundle from './subtitles';
import examplesBundle from './examples';
import arduinoBundle from '../arduino';

import 'react-select/dist/react-select.css?global';

export default function (bundle) {

  /* The player and recorder bundles must be included early to allow other
     bundles to register replay/record handlers in their deferred callbacks. */
  bundle.include(replayBundle);
  bundle.include(recordBundle);

  /* The language bundle must be included before the examples bundle. */
  bundle.include(langBundle);

  bundle.include(buffersBundle);
  bundle.include(stepperBundle);
  bundle.include(optionsBundle);
  bundle.include(mainViewBundle);
  bundle.include(mainViewPanesBundle);
  bundle.include(resizeBundle);
  bundle.include(fullscreenBundle);
  bundle.include(menuBundle);
  bundle.include(loginBundle);
  bundle.include(clientApiBundle);
  bundle.include(subtitlesBundle);
  bundle.include(examplesBundle);
  bundle.include(arduinoBundle);

};
