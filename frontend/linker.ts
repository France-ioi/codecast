import {Store} from './store';
import {applyMiddleware, compose, createStore} from 'redux';
import {default as createSagaMiddleware} from 'redux-saga';
import {all, call} from 'redux-saga/effects';
import {connect} from 'react-redux';

interface Linker {
    scope: any,
    actionTypes: any,
    views: any,
    store: Store,
    reducer: any
    finalize: Function
    start: Function
}

export function link(rootBuilder): Linker {

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

    function undefinedNameError(target, property) {
        throw new Error(`use of undefined name ${property}`);
    }

    function declareActionType(name) {
        if (nameForActionType.has(name)) {
            throw new Error(`action type conflict: ${name}`);
        }
        nameForActionType.set(name, name);
        typeForActionName[name] = name;
    }

    function declareUse(target, names) {
        useQueue.push([target, names]);
    }

    function addEnhancer(enhancer) {
        enhancers.push(enhancer);
    }

    /* Publish a value in the global scope. */
    function publish(type, name, value) {
        if (name in globalScope) {
            throw new Error(`linker conflict on ${name}`);
        }
        typeMap.set(name, type);
        globalScope[name] = value;
    }

    /* Look up a value in the global scope. */
    function lookup(name) {
        return globalScope[name];
    }

    /* Inject a value into a local scope. */
    function inject(typeFilter, locals, name) {
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
    function injectAll(typeFilter) {
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
    const views = {};
    rootBundle._linkViews(views);
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

    // Store is too huge for this extension to work properly.
    // const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    // let enhancer = composeEnhancers(
    //    applyMiddleware(sagaMiddleware)
    // );

    let enhancer = applyMiddleware(sagaMiddleware);
    for (let other of enhancers) {
        enhancer = compose(enhancer, other);
    }

    // Create the store.
    const store = createStore(reducer, null, compose(applyMiddleware(sagaMiddleware), ...enhancers));

    window.store = store;

    function finalize(...args) {
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

    function start(...args) {
        return sagaMiddleware.run(rootSaga, args);
    }

    return {
        scope: globalScope,
        actionTypes: typeForActionName,
        views,
        store,
        reducer,
        finalize,
        start
    };
}

function undeclaredDependencyError(target, property) {
    throw new Error(`use of undeclared dependency ${property}`);
}

class Bundle {
    builder: any;
    locals: any;
    _:any;

    constructor(linker, builder) {
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

    include(builder) {
        this._assertNotSealed();
        const bundle = new Bundle(this._.linker, builder);
        this._.bundles.push(bundle);
        builder(bundle, bundle.locals);
        return bundle.locals;
    }

    use(...names) {
        this._assertNotSealed();
        this._.linker.declareUse(this.locals, names);
    }

    pack(...names) {
        this._assertNotSealed();
        const target = makeSafeProxy({}, undeclaredDependencyError);
        this._.linker.declareUse(target, names);
        return target;
    }

    defineValue(name, value) {
        this._assertNotSealed();
        this._.linker.publish('value', name, value);
        this.use(name);
    }

    defineSelector(name, value) {
        this._assertNotSealed();
        this._.linker.publish('selector', name, value);
        this.use(name);
    }

    defineAction(name) {
        this._assertNotSealed();
        this._.linker.declareActionType(name);
        this._.linker.publish('action', name, name);
        this.use(name);
    }

    defineView(name, selector, view) {
        this._assertNotSealed();
        if (view === undefined) {
            view = selector;
            selector = undefined;
        }
        this.use(name);
        this._.views.push({name, view, selector});
    }

    addReducer(name, reducer) {
        this._assertNotSealed();
        if (reducer === undefined) {
            this._.lateReducers.push(name); // name is the reducer function
        } else {
            this.use(name);
            this._.actionReducers.push({name, reducer});
        }
    }

    addEarlyReducer(reducer) {
        this._assertNotSealed();
        this._.earlyReducers.push(reducer);
    }

    addLateReducer(reducer) {
        this._assertNotSealed();
        this._.lateReducers.push(reducer);
    }

    addSaga(saga) {
        this._assertNotSealed();
        this._.sagas.push(saga);
    };

    addEnhancer(enhancer) {
        this._assertNotSealed();
        this._.linker.addEnhancer(enhancer);
    }

    defer(callback) {
        this._assertNotSealed();
        this._.defers.push(callback);
    }

    lookup(name) {
        return this._.linker.lookup(name);
    }

    /* TODO: hide this Bundle methods */

    _assertNotSealed() {
        if (this._.sealed) {
            throw new Error('Dynamically calling epic-linker directives is not supported.');
        }
    }

    _linkViews(views) {
        // Define and connect views.
        for (let i = 0; i < this._.views.length; i += 1) {
            let {name, selector, view} = this._.views[i];
            if (selector !== undefined) {
                if (typeof selector === 'string') {
                    selector = this.locals[selector];
                }
                if (typeof selector !== 'function') {
                    throw new Error(`invalid selector for view ${name}`);
                }
                view = connect(selector)(view);
            }
            view.displayName = `View(${name})`;
            this._.linker.publish('view', name, view);
            views[name] = view;
        }

        // Define and connect views in included bundles.
        for (let i = 0; i < this._.bundles.length; i += 1) {
            this._.bundles[i]._linkViews(views);
        }
    }

    _runDefers(...args) {
        // The bundle's defers run first,
        for (let i = 0; i < this._.defers.length; i += 1) {
            this._.defers[i].call(null, ...args);
        }

        // followed by the defers in included bundles.
        for (let i = 0; i < this._.bundles.length; i += 1) {
            this._.bundles[i]._runDefers(...args);
        }
    }

    _earlyReducer() {
        const reducers = this._.earlyReducers.concat(
            this._.bundles.map(bundle => bundle._earlyReducer()));
        // [x1,…,xn].reduce(f, a) = f(f(f(a,x1), …), xn)
        // Use directCompose so that early-reducers added first apply first.
        return reducers.reduce(reverseCompose, null);
    }

    _buildActionMap(actionMap) {
        for (let i = 0; i < this._.actionReducers.length; i += 1) {
            const {name, reducer} = this._.actionReducers[i];
            const actionType = this.locals[name];
            const prevReducer = actionMap.get(actionType);
            actionMap.set(actionType, reverseCompose(prevReducer, reducer));
        }

        for (let i = 0; i < this._.bundles.length; i += 1) {
            this._.bundles[i]._buildActionMap(actionMap);
        }
    }

    _lateReducer() {
        const reducers = this._.lateReducers.concat(
            this._.bundles.map(bundle => bundle._lateReducer()));
        // [x1,…,xn].reduce(f, a) = f(f(f(a,x1), …), xn)
        // Use directCompose so that late-reducers added first apply last.
        return reducers.reduce(directCompose, null);
    }

    _saga() {
        const {sagas, bundles} = this._;

        return function* (args) {
            const effects = [];
            for (let saga of sagas) {
                effects.push(call(saga, ...args));
            }
            for (let bundle of bundles) {
                effects.push(call(bundle._saga(), args));
            }
            yield all(effects);
        };
    }

    _seal() {
        this._.sealed = true;
        for (let i = 0; i < this._.bundles.length; i += 1) {
            this._.bundles[i]._seal();
        }
    }
}

function makeSafeProxy(obj, onError) {
    if (typeof Proxy !== 'function') {
        return obj;
    }

    const safeGet = function(target, property) {
        if (property in target) {
            return target[property];
        } else {
            return onError(target, property);
        }
    }

    return new Proxy(obj, {get: safeGet});
}

function directCompose(secondReducer, firstReducer) {
    if (!firstReducer) {
        return secondReducer;
    }
    if (!secondReducer) {
        return firstReducer;
    }
    return (state, action) => secondReducer(firstReducer(state, action), action);
}

function reverseCompose(firstReducer, secondReducer) {
    if (!firstReducer) {
        return secondReducer;
    }
    if (!secondReducer) {
        return firstReducer;
    }
    return (state, action) => secondReducer(firstReducer(state, action), action);
}
