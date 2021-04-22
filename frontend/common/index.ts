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
import loginBundle from './login';
import clientApiBundle from './client_api';
import subtitlesBundle from '../subtitles';
import taskBundle from '../task';
import layoutBundle from '../task/layout/layout';
import examplesBundle from './examples';
import stepperBundle from '../stepper';
import {Bundle} from "../linker";

export default function(bundle: Bundle) {
    bundle.include(errorBundle);

    /* The player and recorder bundles must be included early to allow other
       bundles to register replay/record handlers in their deferred callbacks. */
    bundle.include(replayBundle);
    bundle.include(recordBundle);

    /* The options bundle must be included before the lang and stepper bundles
       (see ioPane). */
    bundle.include(optionsBundle);

    /* The language bundle must be included before the examples bundle. */
    bundle.include(langBundle);

    bundle.include(buffersBundle);
    bundle.include(resizeBundle);
    bundle.include(fullscreenBundle);
    bundle.include(loginBundle);
    bundle.include(clientApiBundle);
    bundle.include(subtitlesBundle);
    bundle.include(examplesBundle);

    bundle.include(taskBundle);
    bundle.include(layoutBundle);

    bundle.include(stepperBundle);
}
