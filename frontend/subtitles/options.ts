export function getPersistentOptions() {
    let opts;
    try {
        opts = JSON.parse(window.localStorage.subtitles);
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
    window.localStorage.subtitles = JSON.stringify(opts);
}
