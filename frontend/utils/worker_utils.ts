import {EventEmitter2} from 'eventemitter2';
import {call, take} from 'redux-saga/effects';
import {buffers, eventChannel} from 'redux-saga';

export function spawnWorker(audioWorker, audioWorkerUrl) {
    return new Promise(function(resolve, reject) {
        const worker = audioWorkerUrl ? new Worker(audioWorkerUrl) : new audioWorker();
        worker.onerror = function(event) {
            worker.onerror = null;
            worker.onmessage = null;
            reject('worker failed to initialize');
        };
        worker.onmessage = function(event) {
            worker.onerror = null;
            worker.onmessage = null;
            /* The worker is expected to post a null message once initialized,
               any other value is considered to be an error. */
            if (event.data !== null) {
                reject(event.data);
            } else {
                resolve(wrapWorker(worker));
            }
        };
        worker.postMessage(null);
    });
}

class WorkerError extends Error {
    constructor(public request, public response) {
        super('error in worker');
        this.name = 'WorkerError';
        this.request = request;
        this.response = response;
    }
}

function wrapWorker(worker) {
    const emitter = new EventEmitter2();
    let nextTransactionId = 1;
    worker.onmessage = function(message) {
        if (typeof message.data.id === 'string') {
            emitter.emit(message.data.id, message.data);
        }
    };

    function kill() {
        worker.terminate();
    }

    function post(command, payload) {
        worker.postMessage({command, payload});
    }

    function listen(id, buffer?) {
        return eventChannel(function(listener) {
            emitter.on(id, listener);
            return function() {
                emitter.off(id, listener);
            };
        }, buffer || buffers.expanding(1));
    }

    function* callSaga(command, payload, progress) {
        const request = {id: 't' + nextTransactionId, command, payload};
        nextTransactionId += 1;
        const channel = yield call(listen, request.id);
        worker.postMessage(request);
        try {
            while (true) {
                const response = yield take(channel);
                if (response.error) {
                    throw new WorkerError(request, response);
                }
                if (response.done) {
                    return response.payload;
                }
                if (typeof progress === 'function') {
                    yield call(progress, response.payload);
                }
            }
        } finally {
            channel.close();
        }
    }

    return {emitter, kill, post, listen, call: callSaga};
}
