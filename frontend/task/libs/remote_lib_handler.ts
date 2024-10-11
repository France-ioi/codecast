import {Codecast} from '../../app_types';
import {asyncRequestJson} from '../../utils/api';
import {recorderAddFile} from '../../recorder/actionTypes';

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
    const remoteHandler = async function () {
        const taskPlatformUrl = Codecast.options.taskPlatformUrl;

        let args = [...arguments];
        args.pop();

        const body = {
            libraryName,
            callName,
            args,
        };

        const result = (await asyncRequestJson(taskPlatformUrl + '/remote-lib-call', body, false)) as {success: boolean, result?: any, error?: string};
        if (result?.success) {
            const fileData = getResultFileData(result.result);
            console.log('file data', {fileData}, result.result)
            if (fileData) {
                // TODO: if it's a file type, get it from the server and add it to the current recording
                // in the state recorder.additionalFiles.push(...)

                //TODO: convert this to a function generator capable of handling Redux-saga events
                // yield* put(recorderAddFile(fileData));

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
