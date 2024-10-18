import {Codecast} from '../../app_types';
import {asyncRequestJson} from '../../utils/api';
import {call} from 'typed-redux-saga';
import {stepperAddFile} from '../../stepper/actionTypes';
import {AppStore} from '../../store';

export interface FileDescriptor {
    fileType: string,
    fileName: string,
    fileUrl: string,
}

function getResultFileData(result: unknown, body: {libraryName: string, callName: string, args: any[]}, previousFiles: FileDescriptor[]): FileDescriptor|null {
    if (!result || !result['fileType']) {
        return null;
    }

    const originalName = body.args[0] as FileDescriptor|string;
    let newName = [
        ...('imread' === body.callName ? [] : [body.callName]),
        'object' === typeof originalName && 'fileName' in originalName ? originalName.fileName : originalName,
    ].join('-');

    let i = 1;
    while (previousFiles.find(file => newName === file.fileName)) {
        const [fileName, extension] = newName.split('.');
        newName = `${fileName}-${i}.${extension}`;
        i++;
    }

    const taskPlatformUrl = Codecast.options.taskPlatformUrl;

    return {
        fileType: result['fileType'],
        fileName: newName,
        fileUrl: taskPlatformUrl + result['fileUrl'],
    };
}

export function generateRemoteLibHandler(libraryName: string, callName: string) {
    const remoteHandler = function* () {
        const taskPlatformUrl = Codecast.options.taskPlatformUrl;

        let args = [...arguments];
        args.pop();

        const body = JSON.parse(JSON.stringify({
            libraryName,
            callName,
            args,
        }));

        let result;
        yield ['interact', {saga: function* () {
            result = (yield* call(asyncRequestJson, taskPlatformUrl + '/remote-lib-call', body, false)) as {success: boolean, result?: any, error?: string};
        }}];

        if (result?.success) {
            const state: AppStore = yield ['state'];
            const fileData = getResultFileData(result.result, body, state.stepper.files ?? []);
            if (fileData) {
                yield ['put', stepperAddFile(fileData)];

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
