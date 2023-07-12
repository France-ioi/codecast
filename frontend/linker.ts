import {default as createSagaMiddleware, Saga} from 'redux-saga';
import {all, call} from 'typed-redux-saga';
import produce from "immer";
import {AppStore} from "./store";
import {configureStore} from "@reduxjs/toolkit";
import taskSlice from "./task/task_slice";
import documentationSlice from "./task/documentation/documentation_slice";
import hintsSlice from "./task/hints/hints_slice";
import log from "loglevel";
import platformSlice from "./task/platform/platform_slice";
import analysisSlice from "./stepper/analysis/analysis_slice";
import modalSlice from "./common/modal_slice";
import submissionSlice from "./submission/submission_slice";
import {App, CodecastEnvironmentMonitoring} from './app_types';
import buffersSlice from './buffers/buffers_slice';

export interface Linker {
    scope: App,
    actionTypes: {
        [key: string]: string
    },
    store: AppStore,
    finalize: Function
    start: Function,
    monitoring: CodecastEnvironmentMonitoring,
}

export function link(rootBuilder, globalScope: App): Linker {
    // Type map (value|selector|action|view) used to stage injections.
    const typeMap = new Map();

    // Map(action type → action name)
    const nameForActionType = new Map();

    // object mapping (action name → action type)
    const typeForActionName = {};

    // 'use' directives are queued and dependency objects are populated after
    // all definitions have taken effect.
    const useQueue = [];

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
    const linker = {publish, declareUse, declareActionType, lookup};
    const rootBundle = new Bundle(linker, rootBuilder);
    rootBuilder(rootBundle, rootBundle.locals);

    // Seal the bundles to ensure all linking is done statically.
    // rootBundle._seal();

    /* Views can depend on selector definitions, so inject them in a second phase. */
    injectAll(['action', 'value']);

    // Compose the reducer now that all actions have been defined.
    const actionMap = new Map();
    rootBundle._buildActionMap(actionMap);
    const actionReducer = function(state, action) {
        if (actionMap.has(action.type)) {
            state = actionMap.get(action.type)(state, action);
        }

        return state;
    };
    const rootReducer = [
        rootBundle._earlyReducer(),
        actionReducer,
        rootBundle._lateReducer()
    ].reduce(reverseCompose, null);

    let sagaMonitoringListeners = {
        effectTriggered: [],
        effectResolved: [],
        effectRejected: [],
        effectCancelled: [],
    };

    const sagaMonitor = {
        effectTriggered: function () {
            for (let listener of sagaMonitoringListeners.effectTriggered) {
                listener(...arguments);
            }
        },
        effectResolved: function () {
            for (let listener of sagaMonitoringListeners.effectResolved) {
                listener(...arguments);
            }
        },
        effectRejected: function () {
            for (let listener of sagaMonitoringListeners.effectRejected) {
                listener(...arguments);
            }
        },
        effectCancelled: function () {
            for (let listener of sagaMonitoringListeners.effectCancelled) {
                listener(...arguments);
            }
        },
    };

    const monitoring: CodecastEnvironmentMonitoring = {
        effectTriggered: (callback) => {
            sagaMonitoringListeners.effectTriggered.push(callback);
        },
        effectResolved: (callback) => {
            sagaMonitoringListeners.effectResolved.push(callback);
        },
        effectRejected: (callback) => {
            sagaMonitoringListeners.effectRejected.push(callback);
        },
        effectCancelled: (callback) => {
            sagaMonitoringListeners.effectCancelled.push(callback);
        },
        clearListeners() {
            sagaMonitoringListeners = {
                effectTriggered: [],
                effectResolved: [],
                effectRejected: [],
                effectCancelled: [],
            };
        },
    };

    // Compose the enhancers.
    const sagaMiddleware = createSagaMiddleware({
        sagaMonitor,
        onError: (error, {sagaStack}) => {
            console.error(error);
            console.error(sagaStack);
            setImmediate(() => {
                throw error;
            });
        }
    });

    const userTimingMiddleware = () => (next) => (action) => {
        if (performance.mark === undefined) {
            return next(action);
        }

        performance.mark(`${action.type}_start`);

        const result = next(action);
        performance.mark(`${action.type}_end`);
        performance.measure(
            `${action.type}`,
            `${action.type}_start`,
            `${action.type}_end`,
        );

        return result;
    }

    const immerRootReducer = produce(rootReducer);

    const rootReducerWithSlices = (state, action) => {
        log.getLogger('performance').debug('Root reducer', action);
        let start = window.performance.now();
        let newState = immerRootReducer(state, action);
        let end = window.performance.now();
        log.getLogger('performance').debug(`Execution time: ${end - start} ms`);

        let start2 = window.performance.now();

        const newNewState = customCombineReducers({
            [taskSlice.name]: taskSlice.reducer,
            [platformSlice.name]: platformSlice.reducer,
            [documentationSlice.name]: documentationSlice.reducer,
            [hintsSlice.name]: hintsSlice.reducer,
            [buffersSlice.name]: buffersSlice.reducer,
            [analysisSlice.name]: analysisSlice.reducer,
            [modalSlice.name]: modalSlice.reducer,
            [submissionSlice.name]: submissionSlice.reducer,
        })(newState, action);

        let end2 = window.performance.now();
        log.getLogger('performance').debug(`Execution time2: ${end2 - start2} ms`);

        return newNewState;
    };

    // Create the store.

    const store = configureStore({
        reducer: rootReducerWithSlices,
        preloadedState: {},
        middleware: [sagaMiddleware, userTimingMiddleware],
        devTools: true,
    })

    function finalize(...args) {
        /* Call the deferred callbacks. */
        rootBundle._runDefers(...args);
    }


    function start(...args) {
        const rootSaga = rootBundle._saga();

        return sagaMiddleware.run(rootSaga, args);
    }

    globalScope.dispatch = store.dispatch;

    return {
        scope: globalScope as App,
        actionTypes: typeForActionName,
        store: store as AppStore,
        finalize,
        start,
        monitoring,
    };
}

function undeclaredDependencyError(target, property) {
    throw new Error(`use of undeclared dependency ${property}`);
}

export class Bundle {
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

    defineAction(name) {
        this._assertNotSealed();
        this._.linker.declareActionType(name);
        this._.linker.publish('action', name, name);
        this.use(name);
    }

    addReducer(name: string, reducer: any) {
        this._assertNotSealed();
        if (reducer === undefined) {
            this._.lateReducers.push(name); // name is the reducer function
        } else {
            this.use(name);
            this._.actionReducers.push({
                name,
                reducer: reducer
            });
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

    defer(callback: (app: App) => void): void {
        this._assertNotSealed();
        this._.defers.push(callback);
    }

    lookup(name) {
        return this._.linker.lookup(name);
    }

    _assertNotSealed() {
        if (this._.sealed) {
            throw new Error('Dynamically calling epic-linker directives is not supported.');
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
            yield* all(effects);
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

    return (state, action) => {
        firstReducer(state, action);
        secondReducer(state, action);
    }
}

function reverseCompose(firstReducer, secondReducer) {
    if (!firstReducer) {
        return secondReducer;
    }
    if (!secondReducer) {
        return firstReducer;
    }

    return (state, action) => {
        firstReducer(state, action);
        secondReducer(state, action);
    }
}

// We use our own function instead of Redux one to be able
// to combine a root reducer with key-prefixed slice reducers
// without getting Redux warnings
function customCombineReducers(reducers) {
    let reducerKeys = Object.keys(reducers);
    let finalReducers = {};

    for (let i = 0; i < reducerKeys.length; i++) {
        let key = reducerKeys[i];
        if (typeof reducers[key] === 'function') {
            finalReducers[key] = reducers[key];
        }
    }

    let finalReducerKeys = Object.keys(finalReducers);
    
    return function combination(state, action) {
        if (state === void 0) {
            state = {};
        }

        let hasChanged = false;
        let nextState = {...state};

        for (let _i = 0; _i < finalReducerKeys.length; _i++) {
            let _key = finalReducerKeys[_i];
            let reducer = finalReducers[_key];
            let previousStateForKey = state[_key];
            let nextStateForKey = reducer(previousStateForKey, action);

            nextState[_key] = nextStateForKey;
            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }

        hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
        return hasChanged ? nextState : state;
    };
}
