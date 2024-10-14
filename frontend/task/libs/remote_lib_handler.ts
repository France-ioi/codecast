import {Codecast} from '../../app_types';
import {asyncRequestJson} from '../../utils/api';
import {recorderAddFile} from '../../recorder/actionTypes';
import log from 'loglevel';
import {apply, call} from 'typed-redux-saga';

export interface FileDescriptor {
    fileType: string,
    fileName: string,
    fileUrl: string,
}

function getResultFileData(result: unknown): FileDescriptor|null {
    if (!result || !result['fileType']) {
        return null;
    }

    const taskPlatformUrl = Codecast.options.taskPlatformUrl;

    return {
        fileType: result['fileType'],
        fileName: result['fileName'],
        fileUrl: taskPlatformUrl + result['fileUrl'],
    };
}

export function generateRemoteLibHandler(libraryName: string, callName: string) {
    const remoteHandler = function* () {
        const taskPlatformUrl = Codecast.options.taskPlatformUrl;

        let args = [...arguments];
        args.pop();

        const body = {
            libraryName,
            callName,
            args,
        };

        let result;
        yield ['interact', {saga: function* () {
            result = (yield* call(asyncRequestJson, taskPlatformUrl + '/remote-lib-call', body, false)) as {success: boolean, result?: any, error?: string};
        }}];

        if (result?.success) {
            const fileData = getResultFileData(result.result);
            if (fileData) {
                yield ['put', recorderAddFile(fileData)];

                return fileData;
            }

            return result.result;
        } else {
            throw result.error;
        }
    }

    remoteHandler.recordCallResults = true;

    return remoteHandler;
}
