
import EventEmitter from 'eventemitter2';
import {call, cps} from 'redux-saga/effects';

export function workerUrlFromText (text) {
  const blob = new Blob([text], {type: "application/javascript;charset=UTF-8"});
  const url = URL.createObjectURL(blob);
  return url;
}

export function* spawnWorker (url) {
  const worker = yield call(asyncSpawnWorker, url);
  const emitter = worker.emitter = new EventEmitter();
  worker.nextResponseId = 1;
  worker.onmessage = emitResponseEvent;
  return worker;
  function emitResponseEvent (event) {
    emitter.emit(event.data.id, event.data);
  };
};

export function* killWorker (worker) {
  worker.terminate();
};

export function* callWorker (worker, message) {
  message.responseId = 'r' + worker.nextResponseId;
  worker.nextResponseId += 1;
  worker.postMessage(message);
  return yield cps(waitForResponse);
  function waitForResponse (callback) {
    worker.emitter.once(message.responseId, function (event) {
      callback(null, event);
    });
  }
};

function asyncSpawnWorker (url) {
  return new Promise(function (resolve, reject) {
    if (typeof window.Worker !== 'function') {
      return reject('Web Worker support is missing');
    }
    const worker = new Worker(url);
    worker.onerror = function (event) {
        worker.onerror = null;
        worker.onmessage = null;
      reject('worker failed to initialize');
    };
    worker.onmessage = function (event) {
      worker.onerror = null;
      worker.onmessage = null;
      // The worker is expected to post a null message once initialized,
      // any other value is considered to be an error.
      if (event.data !== null) {
        return reject(event.data);
      } else {
        resolve(worker);
      }
    };
    worker.postMessage(null);
  });
};
