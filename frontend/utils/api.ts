import request from 'superagent';
import {isLocalStorageEnabled} from "../common/utils";

export const asyncRequestJson = function(path, body, withCredentials = true) {
    return new Promise<any>(function(resolve, reject) {
        const req = request.post(path);

        const token = isLocalStorageEnabled() && withCredentials ? window.localStorage.getItem('token') : null;
        req.set('Accept', 'application/json');
        req.send({...body, token});
        req.end(function(err, res) {
            if (err || !res.ok) {
                return reject({err, res});
            }

            resolve(res.body);
        });
    });
};

export const asyncGetJson = function (path, withToken: boolean = false) {
    return new Promise(function(resolve, reject) {
        const req = request.get(path);

        req.set('Accept', 'application/json');
        const token = isLocalStorageEnabled() && withToken ? window.localStorage.getItem('token') : null;
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
};
