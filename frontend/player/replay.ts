/* Replay API */

import {call} from 'redux-saga/effects';

export default function(bundle) {
    const replayApi = {};
    bundle.defineValue('replayApi', replayApi);

    /* For each event a number of handlers can be registered.
       An event is replayed by calling (in registration order) the handlers
       registered with the event, each handler being tasked with updating the
       player context. */
    const eventHandlers = new Map();
    // @ts-ignore
    replayApi.on = function(keys, saga) {
        if (typeof keys === 'string') {
            keys = [keys];
        }
        for (let key of keys) {
            let sagas;
            if (eventHandlers.has(key)) {
                sagas = eventHandlers.get(key);
            } else {
                sagas = [];
                eventHandlers.set(key, sagas);
            }
            sagas.push(saga);
        }
    };
    // @ts-ignore
    replayApi.applyEvent = function* (key, replayContext, event) {
        if (eventHandlers.has(key)) {
            const funcs = eventHandlers.get(key);
            for (let func of funcs) {
                yield call(func, replayContext, event);
            }
        } else {
            console.log(`event ${key} ignored (no replay handler)`);
        }
    };

    /* A number of sagas can be registered to run when the player needs to
       reset the state to a specific instant. */
    const resetSagas = [];
    // @ts-ignore
    replayApi.onReset = function(saga) {
        resetSagas.push(saga);
    };
    // @ts-ignore
    replayApi.reset = function* (instant, quick) {
        for (let saga of resetSagas) {
            yield call(saga, instant, quick);
        }
    };
};
