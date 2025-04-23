import {createAction} from '@reduxjs/toolkit';

export enum CodeHelpMode {
    Code = 'code',
    Issue = 'issue',
}

export const askCodeHelp = createAction('hints/askCodeHelp', (mode: CodeHelpMode, issue?: string) => ({
    payload: {
        mode,
        issue,
    },
}));
