
import request from 'superagent';

export function getJson (path) {
  return new Promise(function (resolve, reject) {
    var req = request.get(path);
    req.set('Accept', 'application/json');
    req.end(function (err, res) {
      if (err) {
        reject({err, res});
      } else {
        resolve(res.body);
      }
    });
  });
};
