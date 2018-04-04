
import {createStore, applyMiddleware, compose} from 'redux';
import {default as createSagaMiddleware} from 'redux-saga';
import {all, call} from 'redux-saga/effects';
import {connect} from 'react-redux';

export default function link (rootBuilder) {

  // The global namespace map (name → value)
  const globalScope = {};

  // Type map (value|selector|action|view) used to stage injections.
  const typeMap = new Map();

  // Map(action type → action name)
  const nameForActionType = new Map();

  // object mapping (action name → action type)
  const typeForActionName = {};

  // Enhancers have a flat structure.
  const enhancers = [];

  // 'use' directives are queued and dependency objects are populated after
  // all definitions have taken effect.
  const useQueue = [];

  const linkErrors = [];

  function undefinedNameError (target, property) {
    throw new Error(`use of undefined name ${property}`);
  }

  function declareActionType (actionType, name) {
    if (nameForActionType.has(actionType)) {
      throw new Error(`action type conflict: ${actionType}`);
    }
    nameForActionType.set(actionType, name);
    typeForActionName[name] = actionType;
  }

  function declareUse (target, names) {
    useQueue.push([target, names]);
  }

  function addEnhancer (enhancer) {
    enhancers.push(enhancer);
  }

  /* Publish a value in the global scope. */
  function publish (type, name, value) {
    if (name in globalScope) {
      throw new Error(`linker conflict on ${name}`);
    }
    typeMap.set(name, type);
    globalScope[name] = value;
  }

  /* Look up a value in the global scope. */
  function lookup (name) {
    return globalScope[name];
  }

  /* Inject a value into a local scope. */
  function inject (typeFilter, locals, name) {
    if (typeFilter) {
      const type = typeMap.get(name);
      if (-1 === typeFilter.indexOf(type)) {
        return;
      }
    }
    if (name in globalScope) {
      locals[name] = globalScope[name];
    } else {
      throw new Error(`undefined dependency: ${name}`);
    }
  }

  /* Inject all values in all local scopes. */
  function injectAll (typeFilter) {
    for (let i = 0; i < useQueue.length; i += 1) {
      const dir = useQueue[i], locals = dir[0], arg = dir[1];
      if (typeof arg === 'string') {
        inject(typeFilter, locals, arg);
      } else if (Array.isArray(arg)) {
        for (let name of arg) {
          inject(typeFilter, locals, name);
        }
      } else {
        throw new Error('invalid use');
      }
    }
  }

  // Call the root builder with a root bundle.
  // This will directly defines all actions and selectors.
  const linker = {publish, declareUse, declareActionType, addEnhancer, lookup};
  const rootBundle = new Bundle(linker, rootBuilder);
  rootBuilder(rootBundle, rootBundle.locals);

  // Seal the bundles to ensure all linking is done statically.
  rootBundle._seal();

  /* Views can depend on selector definitions, so inject them in a second phase. */
  injectAll(['action', 'selector', 'value']);
  rootBundle._linkViews();
  injectAll('views');

  // Compose the reducer now that all actions have been defined.
  const actionMap = new Map();
  rootBundle._buildActionMap(actionMap);
  const actionReducer = function (state, action) {
    if (actionMap.has(action.type)) {
      state = actionMap.get(action.type)(state, action);
    }
    return state;
  };
  const reducer = [
    rootBundle._earlyReducer(),
    actionReducer,
    rootBundle._lateReducer()
  ].reduce(reverseCompose, null);

  // Compose the enhancers.
  const sagaMiddleware = createSagaMiddleware();
  let enhancer = applyMiddleware(sagaMiddleware);
  for (let other of enhancers) {
    enhancer = compose(enhancer, other);
  }

  // Create the store.
  const store = createStore(reducer, null, enhancer);

  function finalize (...args) {
    /* Call the deferred callbacks. */
    rootBundle._runDefers(...args);
  }

  /* Collect the sagas.  The root task is returned, suggested use is:

      start().done.catch(function (error) {
        // notify user that the application has crashed and offer
        // to restart it by calling start() again.
      });

   */
  const rootSaga = rootBundle._saga();
  function start () {
    return sagaMiddleware.run(rootSaga);
  }

  return {
    scope: makeSafeProxy(globalScope, undefinedNameError),
    actionTypes: typeForActionName,
    store,
    reducer,
    finalize,
    start
  };
};

function undeclaredDependencyError (target, property) {
  throw new Error(`use of undeclared dependency ${property}`);
}

function Bundle (linker, builder) {
  this.builder = builder;
  this.locals = makeSafeProxy({}, undeclaredDependencyError);
  this._ = {
    linker: linker,
    bundles: [],
    earlyReducers: [],
    actionReducers: [],
    lateReducers: [],
    views: [],
    defers: [],
    sagas: [],
    sealed: false
  };
}

Bundle.prototype.include = function (builder) {
  this._assertNotSealed();
  const bundle = new Bundle(this._.linker, builder);
  this._.bundles.push(bundle);
  builder(bundle, bundle.locals);
  return bundle.locals;
};

Bundle.prototype.use = function (...names) {
  this._assertNotSealed();
  this._.linker.declareUse(this.locals, names);
};

Bundle.prototype.pack = function (...names) {
  this._assertNotSealed();
  const target = makeSafeProxy({}, undeclaredDependencyError);
  this._.linker.declareUse(target, names);
  return target;
};

Bundle.prototype.defineValue = function (name, value) {
  this._assertNotSealed();
  this._.linker.publish('value', name, value);
  this.use(name);
};

Bundle.prototype.defineSelector = function (name, value) {
  this._assertNotSealed();
  this._.linker.publish('selector', name, value);
  this.use(name);
};

Bundle.prototype.defineAction = function (name, actionType) {
  this._assertNotSealed();
  this._.linker.declareActionType(actionType, name);
  this._.linker.publish('action', name, actionType);
  this.use(name);
};

Bundle.prototype.defineView = function (name, selector, view) {
  this._assertNotSealed();
  if (view === undefined) {
    view = selector;
    selector = undefined;
  }
  this.use(name);
  this._.views.push({name, view, selector});
};

Bundle.prototype.addReducer = function (name, reducer) {
  this._assertNotSealed();
  if (reducer === undefined) {
    this._.lateReducers.push(name); // name is the reducer function
  } else {
    this.use(name);
    this._.actionReducers.push({name, reducer});
  }
};

Bundle.prototype.addEarlyReducer = function (reducer) {
  this._assertNotSealed();
  this._.earlyReducers.push(reducer);
};

Bundle.prototype.addLateReducer = function (reducer) {
  this._assertNotSealed();
  this._.lateReducers.push(reducer);
};

Bundle.prototype.addSaga = function (saga) {
  this._assertNotSealed();
  this._.sagas.push(saga);
};

Bundle.prototype.addEnhancer = function (enhancer) {
  this._assertNotSealed();
  this._.linker.addEnhancer(enhancer);
};

Bundle.prototype.defer = function (callback) {
  this._assertNotSealed();
  this._.defers.push(callback);
};

Bundle.prototype.lookup = function (name) {
  return this._.linker.lookup(name);
};

/* TODO: hide this Bundle methods */

Bundle.prototype._assertNotSealed = function () {
  if (this._.sealed) {
    throw new Error('Dynamically calling epic-linker directives is not supported.');
  }
};

Bundle.prototype._linkViews = function () {
  var i;
  // Define and connect views.
  for (i = 0; i < this._.views.length; i += 1) {
    let {name, selector, view} = this._.views[i];
    if (selector !== undefined) {
      if (typeof selector === 'string') {
        selector = this.locals[selector];
      }
      if (typeof selector !== 'function') {
        throw new Error(`invalid selector for view`, name);
      }
      view = connect(selector)(view);
    }
    view.displayName = `View(${name})`;
    this._.linker.publish('view', name, view);
  }
  // Define and connect views in included bundles.
  for (i = 0; i < this._.bundles.length; i += 1) {
    this._.bundles[i]._linkViews();
  }
};

Bundle.prototype._runDefers = function (...args) {
  var i;
  // The bundle's defers run first,
  for (i = 0; i < this._.defers.length; i += 1) {
    this._.defers[i].call(null, ...args);
  }
  // followed by the defers in included bundles.
  for (i = 0; i < this._.bundles.length; i += 1) {
    this._.bundles[i]._runDefers(...args);
  }
};

Bundle.prototype._earlyReducer = function () {
  const reducers = this._.earlyReducers.concat(
    this._.bundles.map(bundle => bundle._earlyReducer()));
  // [x1,…,xn].reduce(f, a) = f(f(f(a,x1), …), xn)
  // Use directCompose so that early-reducers added first apply first.
  return reducers.reduce(reverseCompose, null);
};

Bundle.prototype._buildActionMap = function (actionMap) {
  var i;
  for (i = 0; i < this._.actionReducers.length; i += 1) {
    const {name, reducer} = this._.actionReducers[i];
    const actionType = this.locals[name];
    const prevReducer = actionMap.get(actionType);
    actionMap.set(actionType, reverseCompose(prevReducer, reducer));
  }
  for (i = 0; i < this._.bundles.length; i += 1) {
    this._.bundles[i]._buildActionMap(actionMap);
  }
};

Bundle.prototype._lateReducer = function () {
  const reducers = this._.lateReducers.concat(
    this._.bundles.map(bundle => bundle._lateReducer()));
  // [x1,…,xn].reduce(f, a) = f(f(f(a,x1), …), xn)
  // Use directCompose so that late-reducers added first apply last.
  return reducers.reduce(directCompose, null);
};

Bundle.prototype._saga = function () {
  var i;
  const effects = [];
  for (i = 0; i < this._.sagas.length; i += 1) {
    effects.push(call(this._.sagas[i]));
  }
  for (i = 0; i < this._.bundles.length; i += 1) {
    effects.push(call(this._.bundles[i]._saga()));
  }
  return function* () {
    yield all(effects);
  };
};

Bundle.prototype._seal = function () {
  var i;
  this._.sealed = true;
  for (i = 0; i < this._.bundles.length; i += 1) {
    this._.bundles[i]._seal();
  }
};

function makeSafeProxy (obj, onError) {
  if (typeof Proxy !== 'function') {
    return obj;
  }
  const safeGet = function (target, property) {
    if (property in target) {
      return target[property];
    } else {
      return onError(target, property);
    }
  }
  return new Proxy(obj, {get: safeGet});
}

function directCompose (secondReducer, firstReducer) {
  if (!firstReducer) {
    return secondReducer;
  }
  if (!secondReducer) {
    return firstReducer;
  }
  return (state, action) => secondReducer(firstReducer(state, action), action);
}

function reverseCompose (firstReducer, secondReducer) {
  if (!firstReducer) {
    return secondReducer;
  }
  if (!secondReducer) {
    return firstReducer;
  }
  return (state, action) => secondReducer(firstReducer(state, action), action);
}
