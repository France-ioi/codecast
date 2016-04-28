
export const actionsDescriptors = {};
export const actionTypes = makeSafeProxy({});
export default actionTypes; // key → type
const keyForActionType = {}; // type → key

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

function defineAction (key, descriptor) {
  if (key in actionsDescriptors) {
    throw `duplicate action descriptor: ${key}`;
  }
  let type_;
  switch (typeof descriptor) {
    case 'object':
      actionsDescriptors[key] = descriptor;
      type_ = descriptor.type;
      break;
    case 'string':
      actionsDescriptors[key] = {type: descriptor};
      type_ = descriptor;
      break;
    default:
      throw "invalid action descriptor";
  }
  if (type_ in keyForActionType) {
    throw `conflicting action type: ${key}`;
  }
  actionTypes[key] = type_;
  keyForActionType[type_] = key;
}

function defineActions (dict) {
  Object.keys(dict).forEach(function (key) {
    if (key !== 'default')
      defineAction(key, dict[key]);
  });
};

defineActions({
  error: 'Error',
  playerPrepare: 'Player.Prepare',
  playerPreparing: 'Player.Preparing',
  playerReady: 'Player.Ready',
  playerSourceInit: 'Player.Source.Init',
  playerInputInit: 'Player.Input.Init',
  playerStart: 'Player.Start',
  playerStarting: 'Player.Starting',
  playerStarted: 'Player.Started',
  playerStop: 'Player.Stop',
  playerStopping: 'Player.Stopping',
  playerStopped: 'Player.Stopped',
  playerPause: 'Player.Pause',
  playerTick: 'Player.Tick'
});
