/* The delay builtin. */

import {delay} from 'redux-saga'
import {take, put, call, race} from 'redux-saga/effects';

export default function (bundle, deps) {

  bundle.use('stepperInterrupt');

  bundle.defer(function ({stepperApi}) {

    stepperApi.addBuiltin('delay', function* delayBuiltin (stepperContext, millis) {
      yield ['interact', /* INTERACT */ function* () {
        yield call(delay, millis.toInteger())
      }];
    });

  });

};
