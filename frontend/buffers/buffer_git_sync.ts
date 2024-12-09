import {call, put, takeEvery} from 'typed-redux-saga';
import {bufferGitOpenPushDialog, bufferGitPull, bufferGitPush} from './buffer_actions';
import {appSelect} from '../hooks';
import {bufferInit, bufferResetDocument} from './buffers_slice';
import {GitSyncParams} from './buffer_types';
import {asyncRequestJson} from '../utils/api';
import {documentToString, TextBufferHandler} from './document';
import {stepperDisplayError} from '../stepper/actionTypes';
import {getMessage} from '../lang';
import {isLocalStorageEnabled} from '../common/utils';
import {createSourceBufferFromDocument} from './index';

export function* bufferGitSyncSagas() {
    yield* takeEvery(bufferGitPull, function* ({payload: {bufferName, source, revision}}) {
        const state = yield* appSelect();
        const bufferState = state.buffers.buffers[bufferName];
        const {gitSync} = bufferState;

        const newGitSync: GitSyncParams = {
            ...gitSync,
            loading: true,
        }

        yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));

        try {
            const gitPullResult = (yield* call(asyncRequestJson, state.options.taskPlatformUrl + '/git/pull', {
                repository: gitSync.repository,
                branch: gitSync.branch,
                file: gitSync.file,
                revision: revision ?? gitSync.revision,
                source: source ?? documentToString(bufferState.document),
            })) as {success: boolean, error?: string, conflictSource?: string, content: string, revision: string};

            if (!gitPullResult.success) {
                throw new Error(gitPullResult.error);
            }

            const newGitSync: GitSyncParams = {
                ...gitSync,
                loading: false,
                revision: gitPullResult.revision,
            };

            yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));

            const document = TextBufferHandler.documentFromString(gitPullResult.content);
            yield* put(bufferResetDocument({buffer: bufferName, document}));
        } catch (e: any) {
            console.error(e);

            if ('conflict' === e?.res?.body?.error) {
                const conflictSource: string = e.res.body.conflict_source;

                const conflictDocument = TextBufferHandler.documentFromString(conflictSource);
                const conflictBuffer = yield* call(createSourceBufferFromDocument, conflictDocument, bufferState.platform, {
                    hidden: true,
                }, {
                    noSwitch: true,
                });

                const newGitSync: GitSyncParams = {
                    ...gitSync,
                    loading: false,
                    conflictSource,
                    conflictRevision: e.res.body.conflict_revision,
                    conflictBuffer,
                };

                yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
            } else {
                yield* put(stepperDisplayError(getMessage('GIT_ERROR_PULL').s));

                const newGitSync: GitSyncParams = {
                    ...gitSync,
                    loading: false,
                };

                yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
            }
        }
    });

    yield* takeEvery(bufferGitOpenPushDialog, function* ({payload: {bufferName}}) {
        const state = yield* appSelect();
        const bufferState = state.buffers.buffers[bufferName];
        const {gitSync} = bufferState;
        const newGitSync: GitSyncParams = {
            ...gitSync,
            commitModalOpen: true,
        };
        yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
    });

    yield* takeEvery(bufferGitPush, function* ({payload: {bufferName, gitCommitMessage, gitUsername}}) {
        const state = yield* appSelect();
        const bufferState = state.buffers.buffers[bufferName];
        const {gitSync} = bufferState;
        const newGitSync: GitSyncParams = {
            ...gitSync,
            loading: true,
            pushError: null,
        };

        if (isLocalStorageEnabled()) {
            localStorage.setItem('git_username', gitUsername);
        }

        yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));

        const content = documentToString(bufferState.document);

        try {
            const gitPushResult = (yield* call(asyncRequestJson, state.options.taskPlatformUrl + '/git/push', {
                repository: gitSync.repository,
                branch: gitSync.branch,
                file: gitSync.file,
                revision: gitSync.revision,
                commitMessage: gitCommitMessage,
                username: gitUsername,
                source: content,
            })) as {success: boolean, error?: string, revision: string};

            if (!gitPushResult.success) {
                throw new Error(gitPushResult.error);
            }

            const newGitSync: GitSyncParams = {
                ...gitSync,
                loading: false,
                revision: gitPushResult.revision,
                commitModalOpen: false,
            };

            yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
        } catch (e: any) {
            console.error(e);

            let pushError = getMessage('GIT_ERROR_PUSH').s;
            if (e?.res?.body?.publicKey) {
                pushError = `${pushError} ${getMessage('GIT_ADD_SSH_KEY')}\n\n${e?.res?.body?.publicKey}`;
            }
            if ('not_up_to_date' === e?.res?.body?.error) {
                pushError = getMessage('GIT_ERROR_PUSH_NOT_UP_TO_DATE').s;
            }

            const newGitSync: GitSyncParams = {
                ...gitSync,
                loading: false,
                pushError,
            };

            yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
        }
    });
}
