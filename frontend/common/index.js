/**
  The "common" component contains elements common to all three modes
  (recorder, player, sandbox).
*/

import {defineAction, include} from '../utils/linker';

import MainView from './main_view';
import fullscreen  from './fullscreen';
import buffers from '../buffers/index';
import errors from './errors';
import examples from './examples';

export default function* () {

  // Sent when the application initializes.
  yield defineAction('init', 'System.Init')

  yield include(MainView);
  yield include(fullscreen);
  yield include(buffers);
  yield include(errors);
  yield include(examples);

};

export const interpretQueryString = function (store, scope, qs) {
  const stepperOptions = {};
  (qs.stepperControls||'').split(',').forEach(function (controlStr) {
    // No prefix to highlight, '-' to disable.
    const m = /^(-)?(.*)$/.exec(controlStr);
    if (m) {
      stepperOptions[m[2]] = m[1] || '+';
    }
  });
  store.dispatch({type: scope.stepperConfigure, options: stepperOptions});

  if ('source' in qs) {
    store.dispatch({type: scope.sourceLoad, text: qs.source||''});
  }

  if ('input' in qs) {
    store.dispatch({type: scope.inputLoad, text: qs.input||''});
  }
};
