/*
  This is the Web Worker that processes messages from audio.js.
  This worker is responsible for building up buffers from an audio stream,
  turning those into WAV file URLs when requested.
  This worker can also paste together multiple WAV files (identified by their
  URL) and return a new WAV file URL.
  This work is done inside a worker to avoid blocking the main browser loop
  during encoding.
*/

import Recording from './recording';
import mp3_encode from './mp3_encode';
import wav_encode from './wav_encode';

var recording = null;
var memoryUsageInterval = null;
var lastHeapSize = 0;

/* On load, respond to a null message with a null message to indicate that
   the worker loaded successfully.  Subsequent message are handled by the
   messageHandler function below. */
self.onmessage = function (e) {
    if (e.data === null) {
        self.onmessage = messageHandler;
        self.postMessage(null);
    }
};

function messageHandler(e) {
    const {id, command, payload} = e.data;
    const t = new Transaction(id);
    try {
        let result = false;
        switch (command) {
            case 'init':
                result = init(payload);
                break;
            case 'addSamples':
                recording.addSamples(payload.samples);
                result = true;
                break;
            case 'truncate':
                result = recording.truncateAt(payload.position);
                break;
            case 'export': {
                result = {};
                const audioBuffer = recording.getAudioBuffer(function (progress) {
                    t.send({step: 'copy', progress});
                });
                result.duration = audioBuffer.duration;
                if (payload.raw) {
                    result.raw = exportRaw(audioBuffer, payload.raw);
                }
                if (payload.wav) {
                    result.wav = exportWav(audioBuffer, payload.wav, function (progress) {
                        t.send({step: 'wav', progress});
                    });
                }
                if (payload.mp3) {
                    result.mp3 = exportMp3(audioBuffer, payload.mp3, function (progress) {
                        t.send({step: 'mp3', progress});
                    });
                }
                break;
            }
            case 'cleanup':
                result = cleanup();
                break;
        }
        t.done(result);
    } catch (error) {
        t.fail(error);
    }
}

function Transaction(id) {
    this._id = id;
}

Transaction.prototype.done = function (payload) {
    self.postMessage({id: this._id, done: true, payload});
};
Transaction.prototype.send = function (payload) {
    self.postMessage({id: this._id, done: false, payload});
};
Transaction.prototype.fail = function (error) {
    self.postMessage({id: this._id, done: true, error});
};

function init({sampleRate, numberOfChannels}) {
    cleanup();
    if (numberOfChannels > 2) {
        throw new Error('invalid number of channels');
    }
    recording = new Recording({numberOfChannels, sampleRate});
    memoryUsageInterval = setInterval(reportMemoryUsage, 1000);
    return true;
}

function reportMemoryUsage() {
    let heapSize = 0;
    if (recording) {
        heapSize = recording.length * recording.numberOfChannels * 4;
    }
    if (heapSize !== lastHeapSize) {
        lastHeapSize = heapSize;
        self.postMessage({id: 'memoryUsage', done: false, payload: heapSize});
    }
}

function cleanup() {
    recording = null;
    if (memoryUsageInterval !== null) {
        clearInterval(memoryUsageInterval);
    }
    return true;
}

function exportRaw(audioBuffer) {
    const {numberOfChannels, sampleRate, length, duration} = audioBuffer;
    const result = {numberOfChannels, sampleRate, length, duration, channels: []};
    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
        result.channels.push(audioBuffer.getChannelData(channelNumber));
    }
    return result;
}

function exportWav(audioBuffer, options, progressCallback) {
    if (typeof options !== 'object') {
        /* Default to PCM16, native number of channels and sample rate.  */
        options = {
            numChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            sampleSize: 2,
        };
    }
    return wav_encode(audioBuffer, options, progressCallback);
}

function exportMp3(audioBuffer, options, progressCallback) {
    if (typeof options !== 'object') {
        options = {
            outputRate: 128 /*kbps*/,
        };
    }
    return mp3_encode(audioBuffer, options, progressCallback);
}
