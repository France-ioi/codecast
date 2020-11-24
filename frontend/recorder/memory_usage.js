import React from 'react';
import {put, takeEvery} from 'redux-saga/effects';
import {buffers} from 'redux-saga';
import {MemoryUsage} from "./MemoryUsage";
import {ActionTypes} from "./actionTypes";

export default function (bundle, deps) {
  bundle.use('recorderPreparing');
  bundle.defineAction(ActionTypes.MemoryUsageChanged);

  bundle.addReducer('init', (state) => state.set('memoryUsage', {heapSize: 0}));
  bundle.addReducer('memoryUsageChanged', (state, {payload}) =>
    state.update('memoryUsage', (value => ({...value, ...payload}))));

  bundle.addSaga(function* () {
    yield takeEvery(ActionTypes.RecorderPreparing, function* ({payload: {progress, worker}}) {
      if (progress === 'worker_ok') {
        const channel = worker.listen('memoryUsage', buffers.sliding(1));
        yield takeEvery(channel, function* ({heapSize}) {
          yield put({type: ActionTypes.MemoryUsageChanged, payload: {workerHeapSize: heapSize}});
        });
      }
    });
  });

  bundle.defineView('MemoryUsage', MemoryUsageSelector, MemoryUsage);

  function MemoryUsageSelector (state) {
    const getMessage = state.get('getMessage');
    const {heapSize} = state.get('memoryUsage');

    return {getMessage, heapSize: (heapSize / (1024 * 1024)).toFixed(1)};
  }
};
