import request from 'superagent';

export const asyncRequestJson = function(path, body) {
    return new Promise(function(resolve, reject) {
        var req = request.post(path);
        req.set('Accept', 'application/json');
        req.send(body);
        req.end(function(err, res) {
            if (err || !res.ok)
                return reject({err, res});
            resolve(res.body);
        });
    });
};
