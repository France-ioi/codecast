/*

This file contains a linker for redux/redux-saga components.

It implements a framework that maintains flat namespaces for actions,
selectors, and views.

Each action is defined either as a string (which is used as its type) or an
object which must contain a 'type' property.  The object form allows an action
descriptor to document the use of the action.

Selectors are functions that extract values from the global state.  A selector
must run quickly and should hence avoid non-trivial computations.

Each component provides a number of named action reducers, the name of an
action reducer name matching an action name (not type).
Multiple action reducers for the same action are currently not supported (an
exception is thrown at link time), but they could be composed in link order.

Each component provides a saga factory, which is given the linked actions and
selectors maps and must return a list of sagas.

Finally, each component provides a views factory, which is given the linked
actions and views maps and must return (view name → React component) map.
If a selector match the view name, the React component is connected to the
store using the selector.

XXX To improve component specifications, components should list the actions,
    selectors, and views that they depend on.
    They could then be passed a linker where safe proxies allow access to only
    the items that have been declared as dependencies.

*/


import {createStore, applyMiddleware, compose} from 'redux';
import createSagaMiddleware from 'redux-saga';
import flatten from 'lodash/flatten';
import Immutable from 'immutable';
import {connect} from 'react-redux';

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

  // action key → action type
  const actions = makeSafeProxy({}, onMissingAction);

  // action type → action key
  const keyForActionType = {};

  // action key → action reducer
  const reducerMap = {};

  const selectors = makeSafeProxy({}, onMissingSelector);

  const sagas = [];

  const enhancers = [];

  // View linking is defered until all selectors have been added.
  const viewQueue = [];

  // view key → React component (connected if selector with same key)
  const views = makeSafeProxy({}, onMissingView);

  const linker = {
    actions,
    selectors,
    views,
    action: addAction,
    selector: addSelector,
    reducer: addReducer,
    saga: addSaga,
    view: addView,
    enhancer: addEnhancer,
    include: include
  };

  function onMissingAction (target, property) {
    throw `undefined action ${property}`;
  }

  function onMissingSelector (target, property) {
    throw `undefined selector ${property}`;
  }

  function onMissingView (target, property) {
    throw `undefined view ${property}`;
  }

  function addAction (key, type_) {
    if (typeof type_ === 'object') {
      type_ = object.type;
    }
    if (key in actions) {
      throw `action key conflict: ${key}`;
    }
    if (type_ in keyForActionType) {
      throw `action type conflict: ${key}`;
    }
    actions[key] = type_;
    keyForActionType[type_] = key;
    return linker;
  }

  function addSelector (key, selector) {
    if (key in selectors) {
      throw `selector conflict: ${key}`;
    }
    selectors[key] = selector;
    return linker;
  }

  function addReducer (key, reducer) {
    // TODO: if key is a function, install it as a global reducer hook.
    if (!(key in actions)) {
      console.warn(`reducer: no such action ${key}`);
      return;
    }
    const actionType = actions[key];
    if (actionType in reducerMap) {
      // TODO: compose the reducers
      console.warn(`reducer: duplicate reducer for ${key}`);
    } else {
      reducerMap[actionType] = reducer;
    }
    return linker;
  }

  function addSaga (saga) {
    sagas.push(saga);
    return linker;
  }

  function addView (key, view) {
    viewQueue.push([key, view]);
    return linker;
  }

  function linkView (key, view) {
    view = key in selectors ? connect(selectors[key])(view) : view;
    if (key in views) {
      throw `view key conflict: ${key}`;
    } else {
      views[key] = view;
    }
  }

  function addEnhancer (enhancer) {
    enhancers.push(enhancer);
    return linker;
  }

  // Apply the specs to the linker.  The specs will declaratively add
  // actions, selectors, reducers, sagas, views, and enhancers.
  function include (specs) {
    if (typeof specs === 'function') {
      specs(linker);
    } else if (Array.isArray(specs)) {
      specs.forEach(include);
    } else {
      throw new Error(`invalid argument to linker#include: ${specs.toString()}`);
    }
    return linker;
  }

  include(specs);
  viewQueue.forEach(function (args) {
    linkView(...args);
  });

  const reducer = function (state, action) {
    // TODO: add support for reducer hooks
    if (action.type in reducerMap) {
      state = reducerMap[action.type](state, action);
    }
    return state;
  }

  let enhancer = applyMiddleware(createSagaMiddleware.apply(null, flatten(sagas)));
  enhancers.forEach(function (other) {
    enhancer = compose(enhancer, other);
  });

  const store = createStore(reducer, null, enhancer);

  return {actions, selectors, views, store};
};
