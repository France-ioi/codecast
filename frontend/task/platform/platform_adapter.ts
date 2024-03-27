import {PlatformTaskParams} from './platform_slice';
import {buffers, eventChannel} from 'redux-saga';
import {Action} from 'redux';
import {platformValidateEvent} from './actionTypes';

export function makePlatformHelperChannel() {
    return eventChannel<{platformHelper: any} | Action>(function (emit) {
        const platformHelper = makePlatformHelper(emit);
        emit({platformHelper});
        return function () {
            for (let prop of Object.keys(platformHelper)) {
                platformHelper[prop] = function () {
                    throw new Error('platform helper channel is closed');
                };
            }
        };
    }, buffers.expanding(4));
}

function makePlatformHelper(emit) {
    return {
        validate: function (mode) {
            emit(platformValidateEvent(mode));
        },
    }
}

export default function (platform) {
    function initWithTask (task) {
        return new Promise<void>(function (resolve, reject) {
            platform.initWithTask(task);
            resolve();
        });
    }

    function getTaskParams (key?, defaultValue?) {
        return new Promise<PlatformTaskParams>(function (resolve, reject) {
            platform.getTaskParams(key, defaultValue, resolve, reject);
        });
    }

    function askHint (hintToken) {
        return new Promise(function (resolve, reject) {
            platform.askHint(hintToken, resolve, reject);
        });
    }

    function validate (mode) {
        return new Promise(function (resolve, reject) {
            platform.validate(mode, resolve, reject);
        });
    }

    function log(details) {
        platform.log(details);
    }

    function updateDisplay (options) {
        return new Promise(function (resolve, reject) {
            platform.updateDisplay(options, resolve, reject);
        });
    }

    function subscribe(helper) {
        platform.subscribe(helper);
    }

    return {
        initWithTask,
        getTaskParams,
        askHint,
        validate,
        log,
        updateDisplay,
        subscribe,
    };
}
