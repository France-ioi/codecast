
import {createStore, applyMiddleware} from 'redux';
import createSagaMiddleware from 'redux-saga';
import Immutable from 'immutable';

import actions from './actions';
import * as reducers from './reducers';
import sagasFactory from './sagas';

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
  addHandlers(reducers);

  const reducer = function (state, action) {
    if (action.type in storeHandlers) {
      state = storeHandlers[action.type](state, action);
    } else {
      console.log('unhandled', action.type);
    }
    return state;
  }

  const initialState = Immutable.Map({
    player: Immutable.Map({
      state: 'idle'
    })
  });

  const sagas = sagasFactory(actions);

  const store = createStore(
    reducer,
    initialState,
    applyMiddleware(
      createSagaMiddleware.apply(null, sagas)
    ));

  return store;
};
