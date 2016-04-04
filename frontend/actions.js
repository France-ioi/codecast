
import * as homeScreenActions from './home_screen/actions';
import * as recordingScreenActions from './recording_screen/actions';
import * as stepperActions from './stepper/actions';
import * as translatorActions from './translator/actions';
import * as recorderActions from './recorder/actions';

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
    defineAction(key, dict[key]);
  });
};

defineAction('error', {
  type: 'system/ERROR',
  descr: "Sent when a generic error has occurred."
});

defineActions(homeScreenActions);
defineActions(recordingScreenActions);
defineActions(stepperActions);
defineActions(translatorActions);
defineActions(recorderActions);

/*
  // These actions are initiated by the user.
  bufferResetText: 'buffer/RESET_TEXT',
  bufferInsertText: 'buffer/INSERT_TEXT',
  bufferDeleteText: 'buffer/DELETE_TEXT',
  bufferCursorText: 'buffer/CURSOR_TEXT',
  bufferSelectText: 'buffer/SELECT_TEXT',
  consoleSetInput: 'console/SET_INPUT',
  consoleInput: 'console/INPUT',
  consoleOutput: 'console/OUTPUT',
  playerStart: 'player/START',
  playerPause: 'player/PAUSE',
  playerSeek: 'player/SEEK',
  playerStop: 'player/STOP',
*/
