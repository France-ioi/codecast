import url from 'url';

export function buildCommonOptions(start, query) {
    const options = {
        start,
        showStepper: true,
        showStack: true,
        showViews: true,
        showIO: true,
        platform: 'unix',
        canChangePlatform: /sandbox|recorder|task/.test(start),
        controls: {},
    };

    if ('language' in query) {
        options.language = query.language;
    }

    (query.stepperControls || '').split(',').forEach(function (controlStr) {
        // No prefix to highlight, '-' to disable.
        const m = /^([-_])?(.*)$/.exec(controlStr);
        if (m) {
            options.controls[m[2]] = m[1] || '+';
        }
    });
    if ('noStepper' in query) {
        options.showStepper = false;
        options.showStack = false;
        options.showViews = false;
        options.showIO = false;
    }
    if ('noStack' in query) {
        options.showStack = false;
    }
    if ('noViews' in query) {
        options.showViews = false;
    }
    if ('noIO' in query) {
        options.showIO = false;
    }
    if ('mode' in query) {
        /* Deprecated */
        switch (query.mode) {
            case 'plain':
                options.platform = 'unix';
            case 'arduino':
                options.platform = 'arduino';
        }
        options.canChangePlatform = false;
    }
    if ('platform' in query) {
        options.platform = query.platform;
        options.canChangePlatform = false;
    }

    if ('source' in query) {
        options.source = query.source || '';
    }
    if ('input' in query) {
        options.input = query.input || '';
    }

    return options;
}

export function buildOptions(config, req, start, callback) {
    const options = buildCommonOptions(start, req.query);
    options.baseUrl = config.baseUrl;
    options.callbackUrl = req.originalUrl;
    options.referer = req.headers.referer || null;
    if (/sandbox/.test(start)) {
        options.origin = req.query.origin || null;
    }
    if (/sandbox|recorder/.test(start)) {
        options.examplesUrl = config.examplesUrl;
    }
    if (/editor|player/.test(start)) {
        options.baseDataUrl = req.query.recording;
        const {s3Bucket: bucket, uploadPath: folder, id: codecast} = parseCodecastUrl(options.baseDataUrl);
        options.codecastData = {bucket, folder, codecast};
    }
    if (/sandbox|editor|statistics/.test(start)) {
        options.isStatisticsReady = !!config.database;
    }
    if (/recorder|editor|statistics|task/.test(start)) {
        if (req.query.recording) {
            options.baseDataUrl = req.query.recording;
            const {s3Bucket: bucket, uploadPath: folder, id: codecast} = parseCodecastUrl(options.baseDataUrl);
            options.codecastData = {bucket, folder, codecast};
            if (req.query.mode === 'edit') {
                options.mode = 'edit';
            } else {
                options.mode = 'play';
            }
        }

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
