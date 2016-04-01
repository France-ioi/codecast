
import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {fork} from 'redux-saga/effects';
import flatten from 'lodash/flatten';

import DevTools from './dev_tools';
import actions from './actions';

import * as homeScreenReducers from './home_screen/reducers';
import * as recorderReducers from './recorder/reducers';
import * as recordingScreenReducers from './recording_screen/reducers';
import * as stepperReducers from './stepper/reducers';
import * as translatorReducers from './translator/reducers';

import recorderSagas from './recorder/sagas';
import recordingScreenSagas from './recording_screen/sagas';
import stepperSagas from './stepper/sagas';
import translatorSagas from './translator/sagas';

export default function storeFactory () {

  const storeHandlers = {};
  function addHandlers (handlers) {
    Object.keys(handlers).forEach(function (key) {
      if (key in actions) {
        const actionType = actions[key];
        if (actionType in storeHandlers) {
          console.warn(`reducer: duplicate handler ${key}`);
        } else {
          storeHandlers[actions[key]] = handlers[key];
        }
      } else {
        console.warn(`reducer: no such action ${key}`);
      }
    });
  }

  // const initialSource: "int main (int argc, char** argv) {\n    return 1;\n}\n";
  const initialSource = "int main (int argc, char** argv) {\n    int a = 1, b = 1;\n    for (a = 0; a < 1000000; a += 1) {\n        b = b * a;\n    }\n    return 1;\n}\n";
  const initialState = {
    screen: 'home',
    home: {
      source: initialSource,
      // source: "int main (int argc, char** argv) {\n    return 1;\n}\n", [1,4-1,13]
      selection: {
        start: {row: 2, column: 20},
        end: {row: 2, column: 27}
      }
    },
    recordingScreen: {},
    recorder: {}
  };

  function reducer (state = initialState, action) {
    if (action.type in storeHandlers) {
      state = storeHandlers[action.type](state, action);
    };
    return state;
  }

  addHandlers(homeScreenReducers);
  addHandlers(recorderReducers);
  addHandlers(recordingScreenReducers);
  addHandlers(stepperReducers);
  addHandlers(translatorReducers);

  const sagas = flatten([
    recorderSagas,
    recordingScreenSagas,
    stepperSagas,
    translatorSagas,
  ].map(function (factory) {
    return factory(actions);
  }));

  return createStore(
    reducer,
    initialState,
    compose(
      applyMiddleware(
        createSagaMiddleware.apply(null, sagas)
      ),
      DevTools.instrument()
    ));

};
