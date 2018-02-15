
// An instant has shape {t, eventIndex, state},
// where state is an Immutable Map of shape {source, input, syntaxTree, stepper, stepperInitial}
// where source and input are buffer models (of shape {document, selection, firstVisibleRow}).

import {delay} from 'redux-saga';
import {take, put, call, race, fork, select} from 'redux-saga/effects';
import * as C from 'persistent-c';
import Immutable from 'immutable';

import {getJson} from '../common/utils';
import {RECORDING_FORMAT_VERSION} from '../version';

export default function (bundle, deps) {

  bundle.use(
    'error', 'replayApi', 'stepperApi',
    'playerPrepare', 'playerPreparing', 'playerReady',
    'playerStart', 'playerStarting', 'playerStarted',
    'playerPause', 'playerPausing', 'playerPaused',
    'playerResume', 'playerResuming', 'playerResumed',
    'playerStop', 'playerStopping', 'playerStopped',
    'playerTick', 'playerSeek', 'playerSeeked',
    'playerAudioReady', 'playerAudioError',
    'getPlayerState',
    'stepperStep', 'stepperEnabled', 'stepperDisabled'
  );

  // pause, resume audio

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

  //
  // Sagas (generators)
  //

  function waitForAudio (audio, timeout) {
    return new Promise(function (resolve, reject) {
      let timer;
      function onCanPlay () {
        audio.pause();
        audio.removeEventListener('canplay', onCanPlay);
        timer && clearTimeout(timer);
        resolve();
      };
      audio.addEventListener('canplay', onCanPlay);
      if (timeout) {
        timer = setTimeout(function () {
          audio.removeEventListener('canplay', onCanPlay);
          reject();
        }, timeout);
      }
    });
  }

  function* watchAudioCanPlay (audio) {
    try {
      // Some browsers, including Chrome, do not load audio (and send the
      // canplay event) unless the window is visible, which results in
      // background tabs failing to load.  The timeout is disabled and we
      // have to wait indefinitely for the autio to load.
      const timeout = false;
      yield call(waitForAudio, audio, timeout);
      const duration = Math.round(audio.duration * 1000);
      yield put({type: deps.playerAudioReady, duration});
    } catch (ex) {
      yield put({type: deps.playerAudioError});
    }
  }

  function* playerPrepare (action) {
    /*
      baseDataUrl is forwarded to playerReady (stored in its reducer) in order
        to serve as the base URL for subtitle files (in the player & editor).
      audioUrl, eventsUrl need to be able to be passed independently by the
        recorder, where they are "blob:" URLs.
    */
    const {baseDataUrl, audioUrl, eventsUrl} = action;
    // Check that the player is idle.
    const player = yield select(deps.getPlayerState);
    if (player.get('status') !== 'idle') {
      return;
    }
    // Emit a Preparing action.
    yield put({type: deps.playerPreparing});
    /* Attempt to force the media player to preload the audio.
       Start playing to force loading and pause in the 'canplay' event. */
    const audio = player.get('audio');
    audio.src = audioUrl;
    audio.load();
    yield fork(watchAudioCanPlay, audio);
    audio.play();
    // While the audio is buffering, download the events, subtitles.
    let data = yield call(getJson, eventsUrl);
    if (Array.isArray(data)) {
      /* Compatibility with old style, where data is an array of events. */
      const {version, ...init} = data[0][2];
      data[0][2] = init;
      data = {version, events: data, subtitles: false};
    }
    /* Compute the future state after every event. */
    const instants = yield call(computeInstants, data.events);
    /* Set up the player. */
    yield put({type: deps.playerReady, baseDataUrl, data, instants});
    yield call(resetToInstant, instants[0], 0, false);
  }

  function* playerStart () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'ready')
        return;
      /* The stepper is disabled during playback. */
      yield put({type: deps.stepperDisabled});
      yield put({type: deps.playerStarting});
      // Reset to current instant, in case the user made changes before
      // starting playback.
      const audio = player.get('audio');
      const audioTime = Math.round(audio.currentTime * 1000);
      yield call(resetToInstant, player.get('current'), audioTime, false);
      audio.play();
      yield put({type: deps.playerStarted});
    } catch (error) {
      yield put({type: deps.error, source: 'playerStart', error});
    }
  }

  function* playerPause () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'playing')
        return;
      yield put({type: deps.playerPausing});
      const audio = player.get('audio');
      audio.pause();
      const audioTime = Math.round(audio.currentTime * 1000);
      // Call resetToInstant to bring the global state in line with the current
      // state.  This is required in particular for the editors that have
      // been updated incrementally by sending them events without updating
      // the global state.  The stepper is enabled if applicable.
      yield call(resetToInstant, player.get('current'), audioTime, false);
      yield put({type: deps.playerPaused});
    } catch (error) {
      yield put({type: deps.error, source: 'playerPause', error});
    }
  }

  function* playerResume () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'paused')
        return;
      yield put({type: deps.playerResuming});
      // Reset to current instant, in case the user made changes while
      // playback was paused.
      const audio = player.get('audio');
      const audioTime = Math.round(audio.currentTime * 1000);
      yield call(resetToInstant, player.get('current'), audioTime, false);
      audio.play();
      yield put({type: deps.playerResumed});
    } catch (error) {
      yield put({type: deps.error, source: 'playerResume', error});
    }
  }

  function* playerStop () {
    try {
      const player = yield select(deps.getPlayerState);
      if (player.get('status') !== 'playing')
        return;
      // Signal that the player is stopping.
      yield put({type: deps.playerStopping});
      // TODO: Stop the audio player.
      yield put({type: deps.playerStopped});
    } catch (error) {
      yield put({type: deps.error, source: 'playerStop', error});
    }
  }

  function* computeInstants (events) {
    /* CONSIDER: create a redux store, use the replayApi to convert each event
       to an action that is dispatched to the store (which must have an
       appropriate reducer) plus an optional saga to be called during playback. */
    const posDiv = Math.max(1, Math.ceil(events.length / 100));
    let pos, progress, lastProgress = 0;
    try {
      const context = {
        state: Immutable.Map(),
        run: null,
        instants: []
      };
      let range;
      for (pos = 0; pos < events.length; pos += 1) {
        const event = events[pos];
        const t = event[0];
        const key = event[1]
        const instant = {t, pos, event};
        yield call(deps.replayApi.applyEvent, key, context, event, instant);
        /* Preserve the last explicitly set range. */
        if ('range' in instant) {
          range = instant.range;
        } else {
          instant.range = range;
        }
        instant.state = context.state;
        context.instants.push(instant);
        progress = Math.ceil(pos / posDiv);
        if (progress !== lastProgress) {
          lastProgress = progress;
          yield put({type: deps.playerPrepareProgress, payload: {progress}});
        }
      }
      return context.instants;
    } catch (ex) {
      yield put({type: deps.playerPrepareFailure, payload: {position: pos}});
      return null;
    }
  }

  bundle.addSaga(function* watchPlayerPrepare () {
    while (true) {
      try {
        const action = yield take(deps.playerPrepare);
        yield call(playerPrepare, action);
      } catch (error) {
        yield put({type: deps.error, source: 'playerPrepare', error});
      }
    }
  });

  bundle.addSaga(function* watchPlayerStart () {
    while (true) {
      yield take(deps.playerStart);
      yield call(playerStart);
    }
  });

  bundle.addSaga(function* watchPlayerPause () {
    while (true) {
      yield take(deps.playerPause);
      yield call(playerPause);
    }
  });

  bundle.addSaga(function* watchPlayerResume () {
    while (true) {
      yield take(deps.playerResume);
      yield call(playerResume);
    }
  });

  bundle.addSaga(function* watchPlayerStop () {
    while (true) {
      yield take(deps.playerStop);
      yield call(playerStop);
    }
  });

  /* A quick reset avoids disabling and re-enabling the stepper (which restarts
     the stepper task). */
  function* resetToInstant (instant, audioTime, quick) {
    const player = yield select(deps.getPlayerState);
    const isPlaying = player.get('status') === 'playing';
    const {state} = instant;
    /* The stepper is already disabled if not paused. */
    if (!isPlaying && !quick) {
      /* A jump occurred, disable the stepper to reset it below. */
      yield put({type: deps.stepperDisabled});
    }
    /* Restore the instant's global state. XXX why not `audioTime: instant.t` */
    yield put({type: deps.playerTick, audioTime, current: instant});
    /* Call the registered reset-sagas to update any non-redux state. */
    yield call(deps.replayApi.reset, instant, quick);
    if (!isPlaying && !quick) {
      /* Re-enable the stepper. */
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
  }

  bundle.addSaga(function* playerTick () {
    while (true) {
      yield take(deps.playerReady);
      while (true) {  // XXX should be 'not stopped' condition
        const outcome = yield race({
          tick: call(delay, 50),
          stopped: take(deps.playerStopping)
        });
        if ('stopped' in outcome)
          break;
        const player = yield select(deps.getPlayerState);
        const instants = player.get('instants');
        const audio = player.get('audio');
        // Process a pending seek.
        const seekTo = player.get('seekTo');
        if (typeof seekTo === 'number') {
          const instant = findInstant(instants, seekTo);
          yield call(resetToInstant, instant, seekTo, false);
          audio.currentTime = seekTo / 1000;
          yield put({type: deps.playerSeeked, current: instant, seekTo});
          continue;
        }
        // If playing, replay the events from the current state to the next.
        const status = player.get('status');
        if (status !== 'playing') {
          continue;
        }
        let ended = false;
        let audioTime = Math.round(audio.currentTime * 1000);
        if (audio.ended) {
          audioTime = player.get('duration');
          ended = true;
        }
        const prevInstant = player.get('current');
        const nextInstant = findInstant(instants, audioTime);
        if (nextInstant.pos < prevInstant.pos) {
          // Event index jumped backwards.
          yield call(resetToInstant, nextInstant, audioTime, false);
        } else if (nextInstant.t > prevInstant.t + 1000 && prevInstant.pos + 10 < nextInstant.pos) {
          // Time between last state and new state jumped by more than 1 second,
          // and there are more than 10 events to replay.
          yield call(resetToInstant, nextInstant, audioTime, true);
        } else if (prevInstant.pos === nextInstant.pos) {
          /* Just update the audioTime */
          yield put({type: deps.playerTick, audioTime, current: nextInstant});
        } else {
          /* Small time delta, replay incremental events immediately following
             prevInstant and up to (and including) nextInstant. */
          for (let pos = prevInstant.pos + 1; pos <= nextInstant.pos; pos += 1) {
            const instant = instants[pos];
            if (instant.saga) {
              /* Keep in mind that the instant's saga runs *prior* to the call
                 to resetToInstant below, and should not rely on the global
                 state being accurate.  Instead, it should use `instant.state`. */
              yield call(instant.saga, instant);
            }
            if (instant.event[1] === 'end') {
              ended = true;
              audioTime = player.get('duration');
            }
            if (instant.reset) {
              yield call(resetToInstant, instant, audioTime, false);
            }
          }
          // Perform a quick reset unless playback has ended.
          yield call(resetToInstant, nextInstant, audioTime, !ended);
          if (ended) {
            audio.pause();
            audio.currentTime = audio.duration;
            yield put({type: deps.playerPaused});
          }
        }
      }
    }
  });

  bundle.defineAction('playerClear', 'Player.Clear');
  bundle.addReducer('playerClear', state =>
    state.set('player', Immutable.Map({
      status: 'idle',
      audio: document.createElement('video')
    })));

  bundle.defineAction('playerPrepareProgress', 'Player.Prepare.Progress');
  bundle.defineAction('playerPrepareFailure', 'Player.Prepare.Failure');

};
