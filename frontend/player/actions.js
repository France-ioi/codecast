
function makeSafeProxy (obj) {
  function safeGet(target, property) {
    if (property in target) {
      // console.log('action', property);
      return target[property];
    } else {
      throw `undefined action ${property}`;
    }
  }
  return new Proxy(obj, {get: safeGet});
}

export default makeSafeProxy({
  error: 'Error',
  playerPrepare: 'Player.Prepare',
  playerPreparing: 'Player.Preparing',
  playerReady: 'Player.Ready',
  playerStart: 'Player.Start',
  playerStarted: 'Player.Started',
  playerStop: 'Player.Stop',
  playerStopping: 'Player.Stopping',
  playerStopped: 'Player.Stopped'
});
