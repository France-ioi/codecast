import request from 'superagent';
import {SubtitlesState} from "./index";

export function updateCurrentItem(subtitles: SubtitlesState, audioTime?: number): void {
    if (subtitles.items) {
        if (audioTime === undefined) {
            audioTime = subtitles.audioTime;
        }

        const currentIndex = findSubtitleIndex(subtitles.items, audioTime);
        const currentItem = subtitles.items[currentIndex];
        const itemVisible = currentItem && (currentItem.data.start <= audioTime) && (audioTime <= currentItem.data.end);

        subtitles.audioTime = audioTime;
        subtitles.currentIndex = currentIndex;
        subtitles.itemVisible = itemVisible;
    }
}

export function findSubtitleIndex(items, time) {
    let low = 0, high = items.length;

    while (low + 1 < high) {
        const mid = (low + high) / 2 | 0;
        const item = items[mid];
        if (item.data.start <= time) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return low;
}

export function filterItems(items, re) {
    if (!re) {
        return items;
    }

    return items.filter(item => item.data.text && -1 !== item.data.text.search(re));
}

export function getSubtitles(url) {
    return new Promise<string>(function(resolve, reject) {
        const req = request.get(url);
        req.set('Accept', 'text/plain'); // XXX mime-type for srt?
        req.end(function(err, res) {
            if (err && err.statusCode === 200) {
                return resolve(err.rawResponse);
            }
            if (err) {
                return reject({err, res});
            }

            resolve(res.text);
        });
    });
}
