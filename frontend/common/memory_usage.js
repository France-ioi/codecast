
import React  from 'react';
import Ticker from 'redux-saga-ticker';
import {take, put, takeEvery, takeLatest} from 'redux-saga/effects';
import {eventChannel, buffers} from 'redux-saga';

export default function (bundle, deps) {

  var b1 = performance.memory.usedJSHeapSize; window.a = new Float32Array(128 * 1024 * 1024); for (var i = 0; i < 16 * 1024 * 1024; i++) { a[i] = i; }; var b2 = performance.memory.usedJSHeapSize; console.log(b2 - b1, performance.memory);

  bundle.use('recorderPreparing');
  bundle.defineAction('memoryUsageChanged', 'MemoryUsage.Changed');

  bundle.addReducer('init', (state) => state.set('memoryUsage', {heapSize: 0, workerHeapSize: 0}));
  bundle.addReducer('memoryUsageChanged', (state, {payload}) =>
    state.update('memoryUsage', (value => ({...value, ...payload}))));

/*
  // Useless because browsers do not report memory usage accurately "for security reasons".
  bundle.addSaga(function* () {
    const tickerChannel = Ticker(1000);
    while (true) {
      const heapSize = performance.memory.usedJSHeapSize;
      yield put({type: deps.memoryUsageChanged, payload: {heapSize}});
      yield take(tickerChannel);
    }
  });
*/

  bundle.addSaga(function* () {
    yield takeEvery(deps.recorderPreparing, function* (action) {
      if (action.progress === 'worker_ok') {
        const {worker} = action;
        const channel = eventChannel(function (listener) {
          function onMemoryUsage (data) {
            console.log('memoryUsage', arguments);
            listener(data);
          }
          worker.emitter.on('memoryUsage', onMemoryUsage);
          return function () {
            worker.emitter.off('memoryUsage', onMemoryUsage);
          };
        }, buffers.sliding(1));
        yield takeLatest(channel, function* (data) {
          console.log('took memoryUsage', data);
          const workerHeapSize = data.heapSize;
          yield put({type: deps.memoryUsageChanged, payload: {workerHeapSize}});
        });
      }
    });
  });

  bundle.defineView('MemoryUsage', MemoryUsageSelector, class MemoryUsage extends React.PureComponent {
    render() {
      const {getMessage, heapSize} = this.props;
      return (<div id='memory-usage' title={getMessage('MEMORY_USAGE')}>{heapSize||'-'}{" MiB"}</div>);
    }
  });

  function MemoryUsageSelector (state) {
    const getMessage = state.get('getMessage');
    const {heapSize, workerHeapSize} = state.get('memoryUsage');
    return {getMessage, heapSize: ((heapSize + workerHeapSize) / (1024 * 1024)).toFixed(1)};
  }

};
