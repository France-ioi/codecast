
import React from 'react';
import {put, takeEvery} from 'redux-saga/effects';
import {buffers} from 'redux-saga';

export default function (bundle, deps) {

  bundle.use('recorderPreparing');
  bundle.defineAction('memoryUsageChanged', 'MemoryUsage.Changed');

  bundle.addReducer('init', (state) => state.set('memoryUsage', {heapSize: 0}));
  bundle.addReducer('memoryUsageChanged', (state, {payload}) =>
    state.update('memoryUsage', (value => ({...value, ...payload}))));

  bundle.addSaga(function* () {
    yield takeEvery(deps.recorderPreparing, function* ({payload: {progress, worker}}) {
      if (progress === 'worker_ok') {
        const channel = worker.listen('memoryUsage', buffers.sliding(1));
        yield takeEvery(channel, function* ({heapSize}) {
          yield put({type: deps.memoryUsageChanged, payload: {workerHeapSize: heapSize}});
        });
      }
    });
  });

  bundle.defineView('MemoryUsage', MemoryUsageSelector, class MemoryUsage extends React.PureComponent {
    render() {
      const {getMessage, heapSize} = this.props;
      return (<div id='memory-usage' title={getMessage('MEMORY_USAGE')}>{heapSize}{" MiB"}</div>);
    }
  });

  function MemoryUsageSelector (state) {
    const getMessage = state.get('getMessage');
    const {heapSize} = state.get('memoryUsage');
    return {getMessage, heapSize: (heapSize / (1024 * 1024)).toFixed(1)};
  }

};
