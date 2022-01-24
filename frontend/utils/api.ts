import request from 'superagent';

export const asyncRequestJson = function(path, body) {
    return new Promise<any>(function(resolve, reject) {
        const req = request.post(path);

        const token = window.localStorage.getItem('token');
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

export const asyncGetJson = function(path) {
    return new Promise(function(resolve, reject) {
        const req = request.get(path);

        req.set('Accept', 'application/json');
        const token = window.localStorage.getItem('token');
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
