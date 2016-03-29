
import EventEmitter from 'eventemitter2';
import {put, cps} from 'redux-saga/effects';

export function workerUrlFromText (text) {
  const blob = new Blob([text], {type: "application/javascript;charset=UTF-8"});
  const url = URL.createObjectURL(blob);
  return url;
}

export function spawnWorker (url) {
  return new Promise(function (resolve, reject) {
    if (typeof window.Worker !== 'function') {
      return reject('Web Worker support is missing');
    }
    const worker = new Worker(url);
    worker.onerror = function (event) {
      worker.onerror = null;
      reject('worker failed to initialize');
    };
    worker.onmessage = function (event) {
      // The first message from the worker is used to indicate that
      // it finished initializing.
      worker.onerror = null;
      worker.onmessage = null;
      resolve({worker});
    };
    worker.postMessage({type: '__init__'});
  });
};

export function* watchWorker (worker, eventType) {
  const queue = [];
  const emitter = new EventEmitter();
  function getNextMessage (callback) {
    if (queue.length > 0) {
      callback(null, queue.shift());
    } else {
      emitter.once('message', function () {
        callback(queue.shift());
      });
    }
  }
  worker.onmessage = function (event) {
    queue.push(event.data);
    if (queue.length === 1) {
      emitter.emit('message');
    }
  };
  while (true) {
    const message = yield cps(getNextMessage);
    yield put({type: eventType, worker, message});
  }
};
