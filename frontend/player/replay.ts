import {call} from 'redux-saga/effects';
import {PlayerInstant} from "./reducers";

export default function(bundle) {
    /* For each event a number of handlers can be registered.
       An event is replayed by calling (in registration order) the handlers
       registered with the event, each handler being tasked with updating the
       player context. */
    const eventHandlers = new Map();

    /* A number of sagas can be registered to run when the player needs to
       reset the state to a specific instant. */
    const resetSagas = [];

    bundle.defineValue('replayApi', {
        on: function(keys, saga) {
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
        },
        applyEvent: function* (key, replayContext, event) {
            if (eventHandlers.has(key)) {
                const funcs = eventHandlers.get(key);
                for (let func of funcs) {
                    yield call(func, replayContext, event);
                }
            } else {
                console.log(`event ${key} ignored (no replay handler)`);
            }
        },
        onReset: function(saga: (instant: PlayerInstant, quick?: boolean) => void): void {
            resetSagas.push(saga);
        },
        reset: function* (instant: PlayerInstant, quick?: boolean) {
            for (let saga of resetSagas) {
                yield call(saga, instant, quick);
            }
        }
    });
}
