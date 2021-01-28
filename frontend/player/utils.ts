/*
  Return the index i such that
  - 0 <= i < instants.length
  - instants[i].t < time
  - instants[i].t < instants[i+1].t  (if i+1 !== instants.length)
*/
import {PlayerInstant} from "./reducers";

export function findInstantIndex(instants: PlayerInstant[], time: number): number {
    let low = 0, high = instants.length;
    while (low + 1 < high) {
        const mid = (low + high) / 2 | 0;
        const state = instants[mid];
        if (state.t <= time) {
            low = mid;
        } else {
            high = mid;
        }
    }

    let instant = instants[low];
    if (instant) {
        /* Return the last instant of a run with equal timestamps. */
        while (low + 1 < instants.length) {
            const nextInstant = instants[low + 1];
            if (nextInstant.t !== instant.t)
                break;
            low += 1;
        }
    }

    return low;
}

export function findInstant(instants: PlayerInstant[], time: number): PlayerInstant {
    const index = findInstantIndex(instants, time);

    return instants[index];
}
