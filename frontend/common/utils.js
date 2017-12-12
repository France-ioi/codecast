
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

function zeroPad2 (n) {
  return ('0'+n).slice(-2);
}

export function formatTime (ms) {
  let s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  s -= m * 60;
  return zeroPad2(m) + ':' + zeroPad2(s);
};
