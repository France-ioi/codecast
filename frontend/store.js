
import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';
import flatten from 'lodash/flatten';
import Immutable from 'immutable';

import DevTools from './dev_tools';
import actions from './actions';

import * as homeScreenReducers from './home_screen/reducers';
import * as prepareScreenReducers from './prepare_screen/reducers';
import * as recorderReducers from './recorder/reducers';
import * as saveScreenReducers from './save_screen/reducers';

import toplevelSagas from './sagas';
import recorderSagas from './recorder/sagas';
import saveScreenSagas from './save_screen/sagas';

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
  const initialState = Immutable.Map({
    screen: 'home',
    home: Immutable.Map({
      screen: Immutable.Map({})
    })
  });

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
  addHandlers(recorderReducers);
  addHandlers(saveScreenReducers);

  const sagas = flatten([
    toplevelSagas,
    recorderSagas,
    saveScreenSagas
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
