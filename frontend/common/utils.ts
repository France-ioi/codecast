import request from 'superagent';
import audioDecode from 'audio-decode';
import {eventChannel} from 'redux-saga';

export function readFileAsText(file) {
    return new Promise<string>(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve((event.target.result) as string);
        };
        reader.onerror = function(event) {
            reject(event.target.error);
        };
        reader.readAsText(file, 'utf-8');
    });
}

export function getAudio(path: string) {
    return eventChannel<{type: string, value?: number, error?: string, audioBuffer?: AudioBuffer, blob?: Blob}>(emitter => {
        request.get(path)
            .accept('audio')
            .responseType('blob')
            .on('progress', e => emitter({type: 'progress', value: e.percent / 100}))
            .end(function(error, response) {
                if (error) return emitter({type: 'error', error});
                audioDecode(response.body, function(error, audioBuffer) {
                    if (error) return emitter({type: 'error', error});
                    emitter({type: 'done', audioBuffer, blob: response.body});
                });
            });
        return () => request.abort();
    });
}

function zeroPad2(n) {
    return ('0' + n).slice(-2);
}

export function formatTime(ms) {
    if (typeof ms !== 'number' || Number.isNaN(ms)) {
        return '—';
    }

    let s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    s -= m * 60;

    return `${zeroPad2(m)}:${zeroPad2(s)}`;
}

export function formatTimeLong(ms: number) {
    let tenths = Math.round(ms / 100);
    let s = Math.floor(tenths / 10);
    const m = Math.floor(s / 60);
    tenths -= s * 10;
    s -= m * 60;

    return `${zeroPad2(m)}:${zeroPad2(s)}.${tenths}`;
}

export function isLocalStorageEnabled() {
    let test = '__testvariable__';
    try {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch(e) {
        return false;
    }
}

export function capitalizeFirstLetter(string: string): string {
    return string && (string.charAt(0).toUpperCase() + string.slice(1));
}

export function nl2br(string: string): string {
    return string.replace(/\n/g, '<br/>');
}

/**
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */

export function murmurhash3_32_gc(key, seed) {
    var remainder, bytes, h1, h1b, c1, c1b, c2, c2b, k1, i;

    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    while (i < bytes) {
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    k1 = 0;

    switch (remainder) {
        // @ts-ignore
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        // @ts-ignore
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);

            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
}
