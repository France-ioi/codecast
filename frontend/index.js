
import 'es5-shim';
import 'es6-shim';
import 'array.prototype.fill'; // Array.prototype.fill
import 'es6-symbol/implement'; // Symbol.iterator

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {applyMiddleware} from 'redux';
import createSagaMiddleware from 'redux-saga';
import Immutable from 'immutable';
import 'rc-slider/dist/rc-slider.css?global';

import style from './style.scss';

// import sagaMonitor from './sagaMonitor';
import link from './linker';

import commonBundle from './common/index';
import sandboxBundle from './sandbox/index';
import playerBundle from './player/index';
import recorderBundle from './recorder/index';
import editorBundle from './editor/index';

const {store, scope, actionTypes, views, finalize, start} = link(function (bundle, deps) {

  bundle.defineAction('init', 'System.Init');
  bundle.addReducer('init', (_state, {payload: options}) =>
    Immutable.Map({scope, actionTypes, views, options}));

  bundle.include(commonBundle);
  bundle.include(sandboxBundle);
  bundle.include(playerBundle);
  bundle.include(recorderBundle);
  bundle.include(editorBundle);

  if (process.env.NODE_ENV === 'development') {
    bundle.addEarlyReducer(function (state, action) {
      console.log('action', action);
      return state;
    });
  }

}/*, {reduxSaga: {sagaMonitor}}*/);
finalize(scope, actionTypes);

function restart () {
  if (Codecast.task) {
    Codecast.task.cancel();
    Codecast.task = null;
  }
  /* XXX Make a separate object for selectors in the linker? */
  Codecast.task = start({
    dispatch: store.dispatch,
    globals: scope,
    selectors: scope,
    actionTypes,
    views});
}

/* In-browser API */
const Codecast = window.Codecast = {store, scope, restart};

/*
  options :: {
    start: 'sandbox'|'player'|'recorder'|'editor',
    baseUrl: url,
    examplesUrl: url,
    baseDataUrl: url,
    user: {…},
    mode: 'plain'|'arduino',
    controls: {…},
    showStepper: boolean,
    showStack: boolean,
    showViews: boolean,
    showIO: boolean,
    source: string,
    input: string,
    token: string
  }
*/
Codecast.start = function (options) {

  store.dispatch({type: scope.init, payload: options});
  // XXX store.dispatch({type: scope.stepperConfigure, options: stepperOptions});

  /* Run the sagas (must be done before calling autoLogin) */
  restart();

  let App;
  switch (options.start) {
    case 'recorder':
      autoLogin();
      store.dispatch({type: scope.recorderPrepare});
      App = scope.RecorderApp;
      break;
    case 'player':
      let audioUrl = options.audioUrl || `${options.baseDataUrl}.mp3`;
      store.dispatch({
        type: scope.playerPrepare,
        payload: {
          baseDataUrl: options.baseDataUrl,
          audioUrl: audioUrl,
          eventsUrl: `${options.baseDataUrl}.json`,
          data: options.data
        }
      });
      App = scope.PlayerApp;
      break;
    case 'editor':
      autoLogin();
      store.dispatch({
        type: scope.editorPrepare,
        payload: {
          baseDataUrl: options.baseDataUrl
        }
      });
      App = scope.EditorApp;
      break;
    case 'sandbox':
      App = scope.SandboxApp;
      break;
    default:
      App = () => <p>{"No such application: "}{options.start}</p>;
      break;
  }

  const {AppErrorBoundary} = scope;
  const container = document.getElementById('react-container');
  ReactDOM.render(
    <Provider store={store}>
      <AppErrorBoundary>
        <App/>
      </AppErrorBoundary>
    </Provider>, container);

};

function autoLogin () {
  let user = null;
  try {
    user = JSON.parse(window.localStorage.user || 'null');
  } catch (ex) {
    return;
  }
  store.dispatch({type: scope.loginFeedback, payload: {user}});
}
