import {createAction} from '@reduxjs/toolkit';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {BufferStateParameters, Document} from './buffer_types';
import {QuickAlgoLibrary} from '../task/libs/quickalgo_library';

export const bufferDownload = createAction('buffer/download');
export const bufferReload = createAction('buffer/reload');
export const bufferCreateSourceBuffer = createAction('buffer/createSourceBuffer', (document?: Document, platform?: CodecastPlatform, parameters: Partial<BufferStateParameters> = {}) => ({
    payload: {
        document,
        platform,
        parameters,
    },
}));
export const bufferResetToDefaultSourceCode = createAction('buffer/resetToDefaultSourceCode', (bufferName: string) => ({
    payload: {
        bufferName,
    },
}));
export const bufferDuplicateSourceBuffer = createAction('buffer/duplicateSourceBuffer');
export const bufferChangePlatform = createAction('buffer/changePlatform', (bufferName: string, platform: CodecastPlatform, document?: Document) => ({
    payload: {
        bufferName,
        platform,
        document,
    },
}));

export const bufferGitPull = createAction('buffer/gitPull', (bufferName: string, source?: string, revision?: string) => ({
    payload: {
        bufferName,
        source,
        revision,
    },
}));
export const bufferGitOpenPushDialog = createAction('buffer/gitOpenPushDialog', (bufferName: string) => ({
    payload: {
        bufferName,
    },
}));
export const bufferGitPush = createAction('buffer/gitPush', (bufferName: string, gitCommitMessage: string, gitUsername: string) => ({
    payload: {
        bufferName,
        gitCommitMessage,
        gitUsername,
    },
}));

export const bufferGetPythonCode = createAction('buffer/getPythonCode', (context: QuickAlgoLibrary, resolve: (code: string) => void, reject: () => void) => ({
    payload: {
        context,
        resolve,
        reject,
    },
}));
