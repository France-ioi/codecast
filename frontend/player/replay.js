
import {call} from 'redux-saga/effects';

export default function (bundle) {

  const replay = {};
  bundle.defineValue('replay', replay);

  /* For each event a number of handlers can be registered.
     When an event is replayed, Each handler */
  const eventHandlers = new Map();
  replay.on = function (keys, handler) {
    if (typeof keys === 'string') {
      keys = [keys];
    }
    for (var key of keys) {
      let handlers;
      if (eventHandlers.has(key)) {
        handlers = eventHandlers.get(key);
      } else {
        handlers = [];
        eventHandlers.set(key, handlers);
      }
      handlers.push(handler);
    }
  };
  replay.applyEvent = function (key, context, event, instant) {
    const funcs = replay.handlers.get(key, []);
    for (var func of funcs) {
      func(context, event, instant);
    }
  };

  /* A number of sagas can be registered to run when the player needs to
     reset the state to a specific instant. */
  const resetSagas = [];
  replay.onReset = function (saga) {
    resetSagas.push(saga);
  };
  replay.reset = function* (instant) {
    for (var saga of resetSagas) {
      yield call(saga, instant);
    }
  };

};
