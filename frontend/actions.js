
import * as homeScreenActions from './home_screen/actions';
import * as prepareScreenActions from './prepare_screen/actions';
import * as recordScreenActions from './record_screen/actions';
import * as saveScreenActions from './save_screen/actions';
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
    if (key !== 'default')
      defineAction(key, dict[key]);
  });
};

defineAction('error', {
  type: 'system/ERROR',
  descr: "Sent when a generic error has occurred."
});

defineActions(homeScreenActions);
defineActions(prepareScreenActions);
defineActions(recordScreenActions);
defineActions(saveScreenActions);

defineActions(recorderActions);
defineActions(stepperActions);
defineActions(translatorActions);

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
