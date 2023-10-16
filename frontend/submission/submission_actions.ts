import {createAction} from '@reduxjs/toolkit';

export const callPlatformValidate = createAction('submission/callPlatformValidate', (action?: string) => ({
    payload: {
        action,
    },
}));
export const submissionExecuteMyTests = createAction('submission/executeMyTests');
export const submissionCreateTest = createAction('submission/createTest');
export const submissionUpdateCurrentTest = createAction('submission/updateCurrentTest', (data: object) => ({
    payload: {
        data,
    },
}));
export const submissionRemoveTest = createAction('submission/removeTest', (testIndex: number) => ({
    payload: {
        testIndex,
    },
}));

export const submissionCancel = createAction('submission/cancel', (submissionIndex: number) => ({
    payload: {
        submissionIndex,
    },
}));
