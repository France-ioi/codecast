
import {delay} from 'redux-saga'
import {take, put, call, race} from 'redux-saga/effects';

export default function (bundle, deps) {

  bundle.use('stepperInterrupt', 'stepperProgress');

  bundle.defer(function ({stepperApi}) {

    stepperApi.addBuiltin('delay', function* delayBuiltin (context, millis) {
      yield ['delay', millis.toInteger()];
    });

    stepperApi.onEffect('delay', function* delayEffect (context, millis) {
      /* Skip the delay in non-interactive mode. */
      if (!context.interactive) {
        return;
      }
      /* Put a 'progress' action so the display accurately reflects the state
         just before the delay. */
      yield put({type: deps.stepperProgress, context});
      /* Allow the delay to be interrupted. */
      const {interrupted} = yield (race({
        completed: call(delay, millis),
        interrupted: take(deps.stepperInterrupt)
      }));
      if (interrupted) {
        throw 'interrupted';
      }
      /* TODO: update context.state from global state to avoid discarding
               user interaction */
    });

  });

};
