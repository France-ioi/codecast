
import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';
import flatten from 'lodash/flatten';
import Immutable from 'immutable';
import {connect} from 'react-redux';

import DevTools from './dev_tools';

function makeSafeProxy (obj, onError) {
  function safeGet(target, property) {
    if (property in target) {
      // console.log('action', property);
      return target[property];
    } else {
      return onError(target, property);
    }
  }
  return new Proxy(obj, {get: safeGet});
}

export default function link (specs) {

  const {actionMaps, reducerMaps, sagaFactories, viewFactories, selectors, initialState} = specs;

  const actionDescriptors = {};          // action key  → action descriptor
  const actionTypes = makeSafeProxy({}, onMissingAction);  // action key  → action type
  const keyForActionType = {};            // action type → action key
  const storeHandlers = {};               // action key  → action reducer

  function onMissingAction (target, property) {
    throw `undefined action ${property}`;
  }

  function onMissingView (target, property) {
    throw `undefined view ${property}`;
  }

  function reducer (state, action) {
    // DEV: Uncomment the next lines to log all actions to the console.
    //if (!/Recorder.Tick/.test(action.type)) {
    //  console.log('reduce', action);
    //}
    if (action.type in storeHandlers) {
      state = storeHandlers[action.type](state, action);
    };
    return state;
  }

  function defineAction (key, descriptor) {
    if (key in actionDescriptors) {
      throw `duplicate action descriptor: ${key}`;
    }
    let type_;
    switch (typeof descriptor) {
      case 'object':
        actionDescriptors[key] = descriptor;
        type_ = descriptor.type;
        break;
      case 'string':
        actionDescriptors[key] = {type: descriptor};
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

  actionMaps.forEach(function defineActions (actionMap) {
    Object.keys(actionMap).forEach(function (key) {
      if (key !== 'default') {
        defineAction(key, actionMap[key]);
      }
    });
  });

  reducerMaps.forEach(function (handlers) {
    Object.keys(handlers).forEach(function (key) {
      if (key === 'default')
        return;
      if (!(key in actionTypes)) {
        console.warn(`reducer: no such action ${key}`);
        return;
      }
      const actionType = actionTypes[key];
      if (actionType in storeHandlers) {
        console.warn(`reducer: duplicate handler ${key}`);
      } else {
        storeHandlers[actionTypes[key]] = handlers[key];
      }
    });
  });

  const sagas = flatten(sagaFactories.map(function (factory) {
    return factory(actionTypes, selectors);
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

  const views = makeSafeProxy({}, onMissingView);
  Object.keys(viewFactories).forEach(function (key) {
    const factory = viewFactories[key];
    const BareView = factory(actionTypes, views);
    const View = key in selectors ? connect(selectors[key])(BareView) : BareView;
    views[key] = View;
  });

  return {actionDescriptors, actionTypes, store, views};

};
