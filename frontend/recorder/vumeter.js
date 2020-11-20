import React from 'react';
import {takeEvery, call, fork, cancel, select} from 'redux-saga/effects';
import {delay} from 'redux-saga/effects';

class Vumeter extends React.PureComponent {
  render () {
    return <canvas ref={this._refCanvas} id='vumeter' width="10" height="100"></canvas>;
  }
  componentDidMount () {
    this.props.dispatch({type: this.props.vumeterMounted, payload: {element: this._canvas}});
  }
  _refCanvas = (el) => {
    this._canvas = el;
  };
}

function VumeterSelector (state) {
  const {vumeterMounted} = state.get('scope');
  return {vumeterMounted};
}

function* vumeterSaga () {
  const {recorderStopped, recorderPreparing, vumeterMounted} = yield select(state => state.get('scope'));
  let vumeterTask;
  let canvasContext;
  yield takeEvery(vumeterMounted, function* ({payload: {element}}) {
    canvasContext = element && element.getContext("2d");
  });
  yield takeEvery(recorderStopped, vumeterCleanupSaga);
  yield takeEvery(recorderPreparing, function* ({payload: {analyser}}) {
    if (!analyser) return;
    yield call(vumeterCleanupSaga);
    vumeterTask = yield fork(vumeterMonitorSaga, analyser);
  });
  function* vumeterMonitorSaga (analyser) {
    const vumeterData = new Uint8Array(analyser.frequencyBinCount);
    // Set up the ScriptProcessor to divert all buffers to the worker.
    periodically(function* () {
      // Get analyser data and update vumeter.
      analyser.getByteFrequencyData(vumeterData);
      let sum = 0, i;
      for (i = 0; i < vumeterData.length; i++) {
        sum += vumeterData[i];
      }
      const average = sum / vumeterData.length;
      canvasContext.fillStyle = '#dddddd';
      canvasContext.fillRect(0, 0, 10, 100);
      canvasContext.fillStyle = '#00ff00';
      canvasContext.fillRect(0, 100 - average, 10, 100);
    });
  }
  function* vumeterCleanupSaga () {
    if (vumeterTask) {
      yield cancel(vumeterTask);
      vumeterTask = null;
    }
  }
  function* periodically (saga) {
    while (true) {
      if (canvasContext) {
        yield call(saga);
      }
      yield delay(100);
    }
  }
}

function vumeterMountedReducer (state, {payload: {element}}) {
  return state.set('vumeterElement', element);
}

export default function (bundle, deps) {

  bundle.defineAction('vumeterMounted', 'Vumeter.Mounted');
  bundle.addReducer('vumeterMounted', vumeterMountedReducer);
  bundle.addSaga(vumeterSaga);
  bundle.defineView('Vumeter', VumeterSelector, Vumeter);

};
