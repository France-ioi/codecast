
export default function (bundle) {

  bundle.defineAction('playerClear', 'Player.Clear');
  bundle.defineAction('playerPrepare', 'Player.Prepare');
  bundle.defineAction('playerPreparing', 'Player.Preparing');
  bundle.defineAction('playerPrepareProgress', 'Player.Prepare.Progress');
  bundle.defineAction('playerPrepareFailure', 'Player.Prepare.Failure');
  bundle.defineAction('playerReady', 'Player.Ready');

  bundle.defineAction('playerStart', 'Player.Start');
  bundle.defineAction('playerStarted', 'Player.Started');
  bundle.defineAction('playerPause', 'Player.Pause');
  bundle.defineAction('playerPaused', 'Player.Paused');
  bundle.defineAction('playerSeek', 'Player.Seek');
  bundle.defineAction('playerSeeked', 'Player.Seeked');

  bundle.defineAction('playerTick', 'Player.Tick');

};