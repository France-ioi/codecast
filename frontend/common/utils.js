import request from 'superagent';
import audioDecode from 'audio-decode';
import {eventChannel} from 'redux-saga'

export function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function (event) {
            resolve(event.target.result);
        };
        reader.onerror = function (event) {
            reject(event.target.error);
        };
        reader.readAsText(file, 'utf-8');
    });
}

export function getJson(path) {
    return new Promise(function (resolve, reject) {
        var req = request.get(path);
        req.set('Accept', 'application/json');
        req.end(function (err, res) {
            if (err) {
                reject({err, res});
            } else {
                resolve(res.body || JSON.parse(res.text));
            }
        });
    });
}

export function postJson(url, data) {
    return new Promise(function (resolve, reject) {
        request.post(url)
            .send(data)
            .set('Accept', 'application/json')
            .catch(reject)
            .then(res => resolve(res.body));
    });
}

export function getAudio(path) {
    return eventChannel(emitter => {
        request.get(path)
            .accept('audio')
            .responseType('blob')
            .on('progress', e => emitter({type: 'progress', value: e.percent / 100}))
            .end(function (error, response) {
                if (error) return emitter({type: 'error', error});
                audioDecode(response.body, function (error, audioBuffer) {
                    if (error) return emitter({type: 'error', error});
                    emitter({type: 'done', audioBuffer, blob: response.body});
                });
            });
        return () => request.abort();
    });
}

function zeroPad2(n) {
    return ('0' + n).slice(-2);
}

export function formatTime(ms) {
    if (typeof ms !== 'number' || Number.isNaN(ms)) return '—';
    let s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    s -= m * 60;
    return `${zeroPad2(m)}:${zeroPad2(s)}`;
}

export function formatTimeLong(ms) {
    let tenths = Math.round(ms / 100);
    let s = Math.floor(tenths / 10);
    const m = Math.floor(s / 60);
    tenths -= s * 10;
    s -= m * 60;
    return `${zeroPad2(m)}:${zeroPad2(s)}.${tenths}`;
}
