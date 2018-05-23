
export default function (bundle) {

  bundle.defineAction('playerClear', 'Player.Clear');
  bundle.defineAction('playerPrepare', 'Player.Prepare');
  bundle.defineAction('playerPreparing', 'Player.Preparing');
  bundle.defineAction('playerAudioReady', 'Player.AudioReady');
  bundle.defineAction('playerAudioError', 'Player.AudioError');
  bundle.defineAction('playerReady', 'Player.Ready');
  bundle.defineAction('playerStart', 'Player.Start');
  bundle.defineAction('playerStarting', 'Player.Starting');
  bundle.defineAction('playerStarted', 'Player.Started');
  bundle.defineAction('playerStop', 'Player.Stop');
  bundle.defineAction('playerStopping', 'Player.Stopping');
  bundle.defineAction('playerStopped', 'Player.Stopped');
  bundle.defineAction('playerPause', 'Player.Pause');
  bundle.defineAction('playerPausing', 'Player.Pausing');
  bundle.defineAction('playerPaused', 'Player.Paused');
  bundle.defineAction('playerResume', 'Player.Resume');
  bundle.defineAction('playerResuming', 'Player.Resuming');
  bundle.defineAction('playerResumed', 'Player.Resumed');
  bundle.defineAction('playerTick', 'Player.Tick');
  bundle.defineAction('playerSeek', 'Player.Seek');
  bundle.defineAction('playerSeeked', 'Player.Seeked');

};