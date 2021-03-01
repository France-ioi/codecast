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
        const formData = new FormData();
        const params = upload.params;
        Object.keys(params).forEach(function(key) {
            formData.append(key, params[key]);
        });
        formData.append('file', blob);

        superagent.post(upload.form_url)
            .send(formData)
            .end(function(err, response) {
                if (err) {
                    return reject(err);
                }

                resolve(response);
            });
    });
}

export function uploadBlobChannel({params, form_url}, blob) {
    return eventChannel(function(listener) {
        const formData = new FormData();
        Object.keys(params).forEach(function(key) {
            formData.append(key, params[key]);
        });
        formData.append('file', blob);

        const request = superagent.post(form_url);
        request.send(formData)
            .on('progress', function(event) {
                listener({type: 'progress', percent: event.percent});
            })
            .end(function(error, response) {
                if (error) {
                    listener({type: 'error', error});
                } else {
                    listener({type: 'response', response});
                }
                listener(END);
            });

        return () => {
            request.abort();
        };
    }, buffers.expanding(1));
}
