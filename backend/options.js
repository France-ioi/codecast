import url from 'url';

export function buildCommonOptions(config, start) {
    return {
        start,
        showStepper: true,
        showStack: true,
        showViews: true,
        showIO: true,
        backend: true,
        showDocumentation: true,
        showFullScreen: true,
        showMenu: true,
        canRecord: false,
        platform: config.hasOwnProperty('defaultPlatform') ? config.defaultPlatform : 'python',
        canChangePlatform: /sandbox|recorder|task/.test(start),
        canChangeLanguage: true,
        controls: {},
    };
}

export function buildOptions(config, req, start, callback) {
    const options = buildCommonOptions(config, start);
    options.audioWorkerUrl = config.audioWorkerUrl;
    options.taskPlatformUrl = config.taskPlatformUrl;
    options.baseUrl = config.baseUrl;
    options.backend = true;
    options.callbackUrl = req.originalUrl;
    options.referer = req.headers.referer || null;
    options.app = 'crane' === req.query.task ? 'tralalere' : config.app;
    options.baseUrl = config.baseUrl;
    if (req.query.platform) {
        options.platform = req.query.platform;
    }
    if (/sandbox/.test(start)) {
        options.origin = req.query.origin || null;
    }
    if (/sandbox|recorder/.test(start)) {
        options.examplesUrl = config.examplesUrl;
    }
    if (/editor|player/.test(start)) {
        options.baseDataUrl = req.query.recording;
        if (options.baseDataUrl) {
            options.audioUrl = `${options.baseDataUrl}.mp3`;
        }
        const {s3Bucket: bucket, uploadPath: folder, id: codecast} = parseCodecastUrl(options.baseDataUrl);
        options.codecastData = {bucket, folder, codecast};
    }
    if (/sandbox|editor|statistics/.test(start)) {
        options.isStatisticsReady = !!config.database;
    }
    if (/recorder|editor|statistics|task/.test(start)) {
        return config.optionsHook(req, options, callback);
    } else {
        return callback(null, options);
    }
}

export function parseCodecastUrl(base) {
    const {hostname, pathname} = url.parse(base);
    const s3Bucket = hostname.replace('.s3.amazonaws.com', '');
    const idPos = pathname.lastIndexOf('/');
    const uploadPath = pathname.slice(1, idPos); // skip leading '/'
    const id = pathname.slice(idPos + 1);

    return {s3Bucket, uploadPath, id};
}
