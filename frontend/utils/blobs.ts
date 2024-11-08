import superagent from 'superagent';
import {buffers, END, eventChannel} from 'redux-saga';

export function getBlob(url: string): Promise<Blob> {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function() {
            resolve(xhr.response);
        };
        xhr.onerror = function(err) {
            reject(err);
        }

        xhr.open('GET', url);
        xhr.send();
    });
}

export function uploadBlob(upload, blob: Blob) {
    return new Promise(function(resolve, reject) {
        superagent.put(upload)
            .set({"Content-Type": blob.type})
            .send(blob)
            .end(function(err, response) {
                if (err) {
                    return reject(err);
                }

                resolve(upload.split('?')[0]);
            });
    });
}

export function uploadBlobChannel(form_url, blob) {
    return eventChannel<{type: string, percent?: number, error?: string, response?: any}>(function(listener) {
        const request = superagent.put(form_url)
            .set({"Content-Type": blob.type});

        request.send(blob)
            .on('progress', function(event) {
                listener({type: 'progress', percent: event.percent});
            })
            .end(function(error, response) {
                if (error) {
                    listener({type: 'error', error});
                } else {
                    listener({type: 'response', response: form_url.split('?')[0]});
                }
                listener(END);
            });

        return () => {
            request.abort();
        };
    }, buffers.expanding(1));
}
