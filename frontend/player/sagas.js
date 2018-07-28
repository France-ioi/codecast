
// An instant has shape {t, eventIndex, state},
// where state is an Immutable Map of shape {source, input, syntaxTree, stepper, stepperInitial}
// where source and input are buffer models (of shape {document, selection, firstVisibleRow}).

import {buffers, eventChannel, END} from 'redux-saga';
import {takeLatest, take, put, call, race, fork, select, cancelled} from 'redux-saga/effects';
import * as C from 'persistent-c';
import Immutable from 'immutable';

import {getJson} from '../common/utils';
import {RECORDING_FORMAT_VERSION} from '../version';

export default function (bundle, deps) {

  bundle.use(
    'replayApi',
    'playerPrepare', 'playerPreparing', 'playerReady',
    'playerPrepareProgress', 'playerPrepareFailure',
    'playerStart', 'playerStarted',
    'playerPause', 'playerPaused',
    'playerSeek', 'playerTick',
    'getPlayerState',
    'stepperStep', 'stepperEnabled', 'stepperDisabled',
  );

  //
  // Sagas (generators)
  //

  bundle.addSaga(function* playerSaga () {
    yield takeLatest(deps.playerPrepare, playerPrepare);
    /* Use redux-saga takeLatest to cancel any executing replay saga. */
    const anyReplayAction = [deps.playerStart, deps.playerPause, deps.playerSeek];
    yield takeLatest(anyReplayAction, replaySaga);
  });

  function* playerPrepare ({payload}) {
    /*
      baseDataUrl is forwarded to playerReady (stored in its reducer) in order
        to serve as the base URL for subtitle files (in the player & editor).
      audioUrl, eventsUrl need to be able to be passed independently by the
        recorder, where they are "blob:" URLs.
    */
    const {baseDataUrl, audioUrl, eventsUrl} = payload;
    // Check that the player is idle.
    const player = yield select(deps.getPlayerState);
    if (player.get('isPlaying')) {
      return;
    }
    // Emit a Preparing action.
    yield put({type: deps.playerPreparing});
    /* Load the audio. */
    const audio = player.get('audio');
    audio.src = audioUrl;
    audio.load();
    /* Load the events. */
    let data = yield call(getJson, eventsUrl);
    if (Array.isArray(data)) {
      /* TODO: warn about incompatible recording */
      yield put({type: deps.playerPrepareFailure, payload: {message: "recording is incompatible with this player"}});
      return;
    }
    /* Compute the future state after every event. */
    const chan = yield call(requestAnimationFrames, 50);
    const replayContext = {
      state: Immutable.Map(),
      events: data.events,
      instants: [],
      /* XXX Consider: addInstant function in replayContext */
      addSaga,
      reportProgress,
    };
    try {
      yield call(computeInstants, replayContext);
      /* The duration of the recording is the timestamp of the last event. */
      const instants = replayContext.instants;
      const duration = instants[instants.length - 1].t;
      yield put({type: deps.playerReady, payload: {baseDataUrl, duration, data, instants}});
      yield call(resetToInstant, instants[0], 0);
    } catch (ex) {
      yield put({type: deps.playerPrepareFailure, payload: {message: `${ex.toString()}`, context: replayContext}});
      return null;
    } finally {
      chan.close();
    }
    function addSaga (saga) {
      let {sagas} = replayContext.instant;
      if (!sagas) {
        sagas = replayContext.instant.sagas = [];
      }
      sagas.push(saga);
    }
    function* reportProgress (progress) {
      yield put({type: deps.playerPrepareProgress, payload: {progress}});
      /* Allow the display to refresh. */
      yield take(chan);
    }
  }

  function* computeInstants (replayContext) {
    /* CONSIDER: create a redux store, use the replayApi to convert each event
       to an action that is dispatched to the store (which must have an
       appropriate reducer) plus an optional saga to be called during playback. */
    let pos, progress, lastProgress = 0, range;
    const events = replayContext.events;
    const duration = events[events.length - 1][0];
    for (pos = 0; pos < events.length; pos += 1) {
      const event = events[pos];
      const t = event[0];
      const key = event[1]
      const instant = {t, pos, event};
      replayContext.instant = instant;
      yield call(deps.replayApi.applyEvent, key, replayContext, event);
      /* Preserve the last explicitly set range. */
      if ('range' in instant) {
        range = instant.range;
      } else {
        instant.range = range;
      }
      instant.state = replayContext.state;
      replayContext.instants.push(instant);
      progress = Math.round(pos * 50 / events.length + t * 50 / duration) / 100;
      if (progress !== lastProgress) {
        lastProgress = progress;
        yield call(replayContext.reportProgress, progress);
      }
    }
  }

  function* replaySaga ({type, payload}) {
    const player = yield select(deps.getPlayerState);
    const isPlaying = player.get('isPlaying');
    const audio = player.get('audio');
    const instants = player.get('instants');
    let instant = player.get('current');

    if (type === deps.playerStart && !player.get('isReady')) {
      /* Prevent starting playback until ready.  Should perhaps wait until
         preparation is done, for autoplay. */
      return;
    }
    if (type === deps.playerStart) {
      let audioTime = player.get('audioTime');
      /* If at end of stream, restart automatically. */
      if (instant.isEnd) {
        audioTime = 0;
        audio.currentTime = 0;
        instant = instants[0];
      }
      /* The player was started (or resumed), reset to the current instant to
         clear any possible changes to the state prior to entering the update
         loop. */
      yield call(resetToInstant, instant, audioTime);
      /* Disable the stepper during playback, its states are pre-computed. */
      yield put({type: deps.stepperDisabled});
      /* Play the audio now that an accurate state is displayed. */
      audio.play();
      yield put({type: deps.playerStarted});
    }

    if (type === deps.playerPause) {
      /* The player is being paused.  The audio is paused first, then the
         audio time is used to reset the state accurately. */
      audio.pause();
      const audioTime = Math.round(audio.currentTime * 1000);
      yield call(resetToInstant, instant, audioTime);
      yield call(restartStepper, instant);
      yield put({type: deps.playerPaused});
      return;
    }

    if (type === deps.playerSeek) {
      if (!isPlaying) {
        /* The stepper is disabled before a seek-while-paused, as it could be
           waiting on I/O. */
        yield put({type: deps.stepperDisabled});
      }
      /* Refreshing the display first then make the jump in the audio should
         make a cleaner jump, as audio will not start playing at the new
         position until the new state has been rendered. */
      const audioTime = Math.max(0, Math.min(player.get('duration'), payload.audioTime));
      instant = findInstant(instants, audioTime);
      yield call(resetToInstant, instant, audioTime);
      if (!isPlaying) {
        /* The stepper is restarted after a seek-while-paused, in case it is
           waiting on I/O. */
        yield call(restartStepper, instant);
      }
      audio.currentTime = audioTime / 1000;
      if (!isPlaying) {
        return;
      }
      /* fall-through for seek-during-playback, which is handled by the
         periodic update loop */
    }

    /* The periodic update loop runs until cancelled by another replay action. */
    const chan = yield call(requestAnimationFrames, 50);
    try {
      while (!instant.isEnd) {
        yield take(chan);
        /* Use the audio time as reference. */
        let audioTime = Math.round(audio.currentTime * 1000);
        if (audio.ended) {
          /* Extend a short audio to the timestamp of the last event. */
          audioTime = instants[instants.length - 1].t;
        }
        instant = yield call(replayToAudioTime, instants, instant, audioTime);
      }
    } finally {
      if (yield cancelled()) {
        chan.close();
      }
    }

    /* Pause when the end event is reached. */
    yield put({type: deps.playerPause});
  }

  function* replayToAudioTime (instants, instant, audioTime) {
    const nextInstant = findInstant(instants, audioTime);
    if (instant.pos === nextInstant.pos) {
      /* Fast path: audio time has advanced but we are still at the same
         instant, just emit a tick event to update the audio time. */
      yield put({type: deps.playerTick, payload: {audioTime, current: instant}});
      return instant;
    }
    if (nextInstant.pos < instant.pos) {
      /* State has jumped backwards.
         This happens when audio time is changed externally during playback. */
      yield call(resetToInstant, nextInstant, audioTime);
      return nextInstant;
    }
    if (nextInstant.pos - instant.pos >= 50) {
      /* State has jumped forward by a large number of events.
         This happens when audio time is changed externally during playback.
         Instead of replaying a lot of events incrementally, do a full reset. */
      yield call(resetToInstant, nextInstant, audioTime);
      return nextInstant;
    }
    /* State has progressed by a small time delta, update the DOM by replaying
       incremental events between `instant` and up to (including) `nextInstant`.
       This can result in a semi-consistent state, where the DOM is accurate
       but updating parts of the global state is deferred until the next full
       (non-quick) reset.
       This mechanism is essential for buffers, for which updating the
       global state and letting that reflecting to the editor would result in
       a costly full-reloading of the editor's state. */
    for (let pos = instant.pos + 1; pos <= nextInstant.pos; pos += 1) {
      instant = instants[pos];
      if (typeof instant.jump === 'number') {
        return yield call(jumpTo, instant.jump);
      }
      if (instant.sagas) {
        /* Keep in mind that the instant's saga runs *prior* to the call
           to resetToInstant below, and should not rely on the global
           state being accurate.  Instead, it should use `instant.state`. */
        for (let saga of instant.sagas) {
          yield call(saga, instant);
        }
      }
      if (instant.isEnd) {
        /* Stop a long audio at the timestamp of the last event. */
        audioTime = instant.t;
      }
      if (instant.reset) {
        /* An instant can request a full reset.
           Currently this feature is not used. */
        yield call(resetToInstant, instant, audioTime);
      }
    }
    /* Performing a quick reset updates the models without pushing changes to
       the DOM, which can be costly.
    */
    yield call(resetToInstant, instant, audioTime, true);
    return instant;
  }

  const findInstant = function (instants, time) {
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
      while (low + 1 < instants.length) {
        const nextInstant = instants[low + 1];
        if (nextInstant.t !== instant.t)
          break;
        low += 1;
      }
    }
    return instants[low];
  };

  /* A quick reset avoids disabling and re-enabling the stepper (which restarts
     the stepper task). */
  function* resetToInstant (instant, audioTime, quick) {
    const {state} = instant;
    /* Call playerTick to store the current audio time and to install the
       current instant's state as state.getIn(['player', 'current']). */
    yield put({type: deps.playerTick, payload: {audioTime, current: instant}});
    /* Call the registered reset-sagas to update any part of the state not
       handled by playerTick. */
    yield call(deps.replayApi.reset, instant, quick);
  }

  function* restartStepper (instant) {
    /* Re-enable the stepper to allow the user to interact with it. */
    yield put({type: deps.stepperEnabled});
    /* If the stepper was running and blocking on input, do a "step-into" to
       restore the blocked-on-I/O state. */
    if (instant.state.get('status') === 'running') {
      const {isWaitingOnInput} = instant.state.get('current');
      if (isWaitingOnInput) {
        yield put({type: deps.stepperStep, mode: 'into'});
      }
    }
  }

  function* jumpTo (audioTime) {
    /* Jump and full reset to the specified audioTime. */
    const player = yield select(deps.getPlayerState);
    const audio = player.get('audio');
    audio.currentTime = audioTime / 1000;
    const instants = player.get('instants');
    const instant = findInstant(instants, audioTime);
    yield call(resetToInstant, instant, audioTime);
    return instant;
  }

};

function requestAnimationFrames (maxDelta) {
  let shutdown = false;
  let lastTimestamp = 0;
  return eventChannel(function (emitter) {
    function onAnimationFrame (timestamp) {
      if (timestamp >= lastTimestamp + maxDelta) {
        lastTimestamp = timestamp;
        emitter(timestamp);
      }
      if (!shutdown) {
        window.requestAnimationFrame(onAnimationFrame);
      }
    }
    window.requestAnimationFrame(onAnimationFrame);
    return function () {
      shutdown = true;
    };
  }, buffers.sliding(1));
}

class Modernizer {
  constructor (events) {
    this._events = events;
  }
  toObject () {
    const {version, source, input, ...init} = this._events[0][2];
    if (source || input) {
      init.buffers = {source, input};
    }
    if (!init.ioPaneMode) {
      init.ioPaneMode = 'split';
    }
    return {
      version,
      events: Array.from({[Symbol.iterator]: () => new ModernizerIterator(init, this._events.slice(1))}),
      subtitles: false
    };
  }
}
