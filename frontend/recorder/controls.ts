import {RecorderControls} from "./RecorderControls";

export default function (bundle) {

  bundle.use(
    'recorderStart', 'recorderStop', 'recorderPause', 'recorderResume',
    'playerStart', 'playerPause', 'playerSeek',
    'getRecorderState', 'getPlayerState',
    'Menu', 'StepperControls'
  );

  bundle.defineView('RecorderControls', RecorderControlsSelector, RecorderControls);
};

function RecorderControlsSelector (state, props) {
  const {getRecorderState, getPlayerState, StepperControls, Menu} = state.get('scope');
  const {recorderStart, recorderPause, recorderResume, recorderStop, playerStart, playerPause, playerSeek} = state.get('actionTypes');
  const getMessage = state.get('getMessage');
  const recorder = getRecorderState(state);
  const recorderStatus = recorder.get('status');
  const isPlayback = recorderStatus === 'paused';
  let canRecord, canPlay, canPause, canStop, canStep, position, duration, playPause;

  if (isPlayback) {
    const player = getPlayerState(state);
    const isReady = player.get('isReady');
    const isPlaying = player.get('isPlaying');
    canPlay = canStop = canRecord = canStep = isReady && !isPlaying;
    canPause = isReady && isPlaying;
    playPause = isPlaying ? 'pause' : 'play';
    position = player.get('audioTime');
    duration = player.get('duration');
  } else {
    canRecord = /ready|paused/.test(recorderStatus);
    canStop = /recording|paused/.test(recorderStatus);
    canPlay = recorderStatus === 'paused';
    canPause = canStep = recorderStatus === 'recording';
    position = duration = recorder.get('elapsed') || 0;
    playPause = 'pause';
  }

  return {
    getMessage,
    recorderStatus, isPlayback, playPause,
    canRecord, canPlay, canPause, canStop, canStep,
    position, duration,
    StepperControls, Menu,
    recorderStart, recorderPause, recorderResume, recorderStop,
    playerStart, playerPause, playerSeek,
  };
}

