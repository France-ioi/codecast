
import request from 'superagent';

export function updateCurrentItem (subtitles, audioTime) {
  if (!subtitles.items) return subtitles;
  if (audioTime === undefined) { audioTime = subtitles.audioTime; }
  const currentIndex = findSubtitleIndex(subtitles.items, audioTime);
  const currentItem = subtitles.items[currentIndex];
  const itemVisible = currentItem && currentItem.start <= audioTime && audioTime <= currentItem.end;
  return {...subtitles, audioTime, currentIndex, itemVisible};
}

function findSubtitleIndex (items, time) {
  let low = 0, high = items.length;
  while (low + 1 < high) {
    const mid = (low + high) / 2 | 0;
    const item = items[mid];
    if (item.start <= time) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

export function filterItems (items, re) {
  if (!re) return items;
  return items.filter(item => item.text && -1 !== item.text.search(re));
}

export function getSubtitles (url) {
  return new Promise(function (resolve, reject) {
    var req = request.get(url);
    req.set('Accept', 'text/plain'); // XXX mime-type for srt?
    req.end(function (err, res) {
      if (err && err.statusCode === 200) return resolve(err.rawResponse);
      if (err) return reject({err, res});
      resolve(res.text);
    });
  });
}
