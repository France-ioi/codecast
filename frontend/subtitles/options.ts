import {isLocalStorageEnabled} from "../common/utils";

export function getPersistentOptions() {
    let opts;
    try {
        opts = JSON.parse(window.localStorage.getItem('subtitles'));
    } catch (ex) {
        // nothing
    }

    return opts || {
        paneEnabled: false,
        bandEnabled: true,
    };
}

export function setPersistentOption(key, value) {
    const opts = getPersistentOptions();
    opts[key] = value;

    if (isLocalStorageEnabled()) {
        window.localStorage.setItem('subtitles', JSON.stringify(opts));
    }
}
