
import {defineAction} from '../utils/linker';

export default function* () {

  yield defineAction('playerPrepare', 'Player.Prepare');
  yield defineAction('playerPreparing', 'Player.Preparing');
  yield defineAction('playerAudioReady', 'Player.AudioReady');
  yield defineAction('playerReady', 'Player.Ready');
  yield defineAction('playerStart', 'Player.Start');
  yield defineAction('playerStarting', 'Player.Starting');
  yield defineAction('playerStarted', 'Player.Started');
  yield defineAction('playerStop', 'Player.Stop');
  yield defineAction('playerStopping', 'Player.Stopping');
  yield defineAction('playerStopped', 'Player.Stopped');
  yield defineAction('playerPause', 'Player.Pause');
  yield defineAction('playerPausing', 'Player.Pausing');
  yield defineAction('playerPaused', 'Player.Paused');
  yield defineAction('playerResume', 'Player.Resume');
  yield defineAction('playerResuming', 'Player.Resuming');
  yield defineAction('playerResumed', 'Player.Resumed');
  yield defineAction('playerTick', 'Player.Tick');
  yield defineAction('playerSeek', 'Player.Seek');

};