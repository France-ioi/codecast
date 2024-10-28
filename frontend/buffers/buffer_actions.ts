import {createAction} from '@reduxjs/toolkit';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {BufferStateParameters, Document} from './buffer_types';

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
