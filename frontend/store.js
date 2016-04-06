
import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {fork} from 'redux-saga/effects';
import flatten from 'lodash/flatten';
import Immutable from 'immutable';

import DevTools from './dev_tools';
import actions from './actions';

import * as homeScreenReducers from './home_screen/reducers';
import * as prepareScreenReducers from './prepare_screen/reducers';
import * as recordScreenReducers from './record_screen/reducers';
import * as saveScreenReducers from './save_screen/reducers';
import * as recorderReducers from './recorder/reducers';
import * as stepperReducers from './stepper/reducers';
import * as translatorReducers from './translator/reducers';

import toplevelSagas from './sagas';
import recorderSagas from './recorder/sagas';
import stepperSagas from './stepper/sagas';
import translatorSagas from './translator/sagas';
import recordScreenSagas from './record_screen/sagas';

export default function storeFactory () {

  const storeHandlers = {};
  function addHandlers (handlers) {
    Object.keys(handlers).forEach(function (key) {
      if (key === 'default')
        return;
      if (!(key in actions)) {
        console.warn(`reducer: no such action ${key}`);
        return;
      }
      const actionType = actions[key];
      if (actionType in storeHandlers) {
        console.warn(`reducer: duplicate handler ${key}`);
      } else {
        storeHandlers[actions[key]] = handlers[key];
      }
    });
  }

  // const initialSource: "int main (int argc, char** argv) {\n    return 1;\n}\n";
  const initialState = {
    screen: 'home',
    screens: Immutable.Map({
      home: {}
    }),
    recorder: {}
  };

  function reducer (state = initialState, action) {
    // DEV: Uncomment the next line to log all actions to the console.
    //console.log('reduce', state, action);
    if (action.type in storeHandlers) {
      state = storeHandlers[action.type](state, action);
    };
    return state;
  }

  addHandlers(homeScreenReducers);
  addHandlers(prepareScreenReducers);
  addHandlers(recordScreenReducers);
  addHandlers(saveScreenReducers);
  addHandlers(recorderReducers);
  addHandlers(stepperReducers);
  addHandlers(translatorReducers);

  const sagas = flatten([
    toplevelSagas,
    recordScreenSagas,
    recorderSagas,
    stepperSagas,
    translatorSagas,
  ].map(function (factory) {
    return factory(actions);
  }));

  const store = createStore(
    reducer,
    initialState,
    compose(
      applyMiddleware(
        createSagaMiddleware.apply(null, sagas)
      ),
      DevTools.instrument()
    ));

  window.store = store;

  return store;
};
