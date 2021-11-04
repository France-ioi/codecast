import {call} from 'redux-saga/effects';
import {PlayerInstant} from "./index";
import {ReplayContext} from "./sagas";
import {Bundle} from "../linker";

/* For each event a number of handlers can be registered.
       An event is replayed by calling (in registration order) the handlers
       registered with the event, each handler being tasked with updating the
       player context. */
const eventHandlers: Map<string, any[]> = new Map();

/* A number of sagas can be registered to run when the player needs to
   reset the state to a specific instant. */
const resetSagas: any[] = [];

const replayApi = {
    on: function(keys: string[] | string, saga: any) {
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
    applyEvent: function* (key: string, replayContext: ReplayContext, event) {
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
        console.log('RESET INSTANT', instant.state);
        for (let saga of resetSagas) {
            yield call(saga, instant, quick);
        }
    }
};

export type ReplayApi = typeof replayApi;

export default function(bundle: Bundle) {
    bundle.defineValue('replayApi', replayApi);
}
