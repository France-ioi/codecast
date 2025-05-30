import request from 'superagent';
import {isLocalStorageEnabled} from "../common/utils";
import {CANCEL} from 'redux-saga';

export const asyncRequestJson = function(path, body, withCredentials = true, headers = {}) {
    let req;
    const promise = new Promise<any>(function(resolve, reject) {
        req = request.post(path);

        if (isLocalStorageEnabled() && withCredentials) {
            body = {
                ...body,
                token: window.localStorage.getItem('token'),
            };
        }
        req.set('Accept', 'application/json');

        for (let [name, value] of Object.entries(headers)) {
            req.set(name, value);
        }

        req.send(body);
        req.end(function(err, res) {
            if (err || !res.ok) {
                return reject({err, res});
            }

            resolve(res.body);
        });
    });

    promise[CANCEL] = () => {
        req.abort();
    };

    return promise;
};

export const asyncGetJson = function (path, query = {}, withToken: boolean = false) {
    let req;
    const promise = new Promise(function(resolve, reject) {
        req = request.get(path);

        req.set('Accept', 'application/json');
        const token = isLocalStorageEnabled() && withToken ? window.localStorage.getItem('token') : null;
        req.query(query);
        if (token) {
            req.query({token});
        }
        req.end(function(err, res) {
            if (err || !res.ok) {
                return reject({err, res});
            }

            resolve(res.body || JSON.parse(res.text));
        });
    });

    promise[CANCEL] = () => {
        req.abort();
    };

    return promise;
};

export const asyncGetFile = function(path) {
    let req;
    const promise = new Promise<string>(function(resolve, reject) {
        req = request.get(path);

        req.end(function(err, res) {
            if (err || !res.ok) {
                return reject({err, res});
            }

            resolve(res.text);
        });
    });

    promise[CANCEL] = () => {
        req.abort();
    };

    return promise;
};
