/**
  The "common" bundle contains elements common to all applications
  (sandbox, player, recorder, editor).
*/

import errorBundle from './error';
import replayBundle from '../player/replay';
import recordBundle from '../recorder/record';
import langBundle from '../lang/index';
import buffersBundle from '../buffers';
import optionsBundle from './options';
import resizeBundle from './resize';
import fullscreenBundle from './fullscreen';
import menuBundle from './menu';
import loginBundle from './login';
import clientApiBundle from './client_api';
import subtitlesBundle from '../subtitles';
import examplesBundle from './examples';
import stepperBundle from '../stepper';

import 'react-select/dist/react-select.css?global';

export default function (bundle) {

  bundle.include(errorBundle);

  /* The player and recorder bundles must be included early to allow other
     bundles to register replay/record handlers in their deferred callbacks. */
  bundle.include(replayBundle);
  bundle.include(recordBundle);

  /* The language bundle must be included before the examples bundle. */
  bundle.include(langBundle);
  /* The options bundle must be included before the stepper bundle (see ioPane). */
  bundle.include(optionsBundle);

  bundle.include(buffersBundle);
  bundle.include(resizeBundle);
  bundle.include(fullscreenBundle);
  bundle.include(menuBundle);
  bundle.include(loginBundle);
  bundle.include(clientApiBundle);
  bundle.include(subtitlesBundle);
  bundle.include(examplesBundle);

  /* TODO: Ultimately we want to support multiple languages, which would be
     done by including a variable stepper bundle.  */
  bundle.include(stepperBundle);

}
