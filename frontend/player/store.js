
import {createStore, applyMiddleware} from 'redux';
import createSagaMiddleware from 'redux-saga';
import Immutable from 'immutable';

import actions from './actions';
import * as reducers from './reducers';
import sagasFactory from './sagas';

export default function storeFactory () {

  const reducer = function (state, action) {
    if (action.type in reducers) {
      state = reducers[action.type](state, action);
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
