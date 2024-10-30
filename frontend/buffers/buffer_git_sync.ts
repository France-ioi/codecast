import {call, put, takeEvery} from 'typed-redux-saga';
import {bufferGitPull, bufferGitPush} from './buffer_actions';
import {appSelect} from '../hooks';
import {bufferInit, bufferResetDocument} from './buffers_slice';
import {GitSyncParams} from './buffer_types';
import {asyncRequestJson} from '../utils/api';
import {documentToString, TextBufferHandler} from './document';
import {stepperDisplayError} from '../stepper/actionTypes';
import {getMessage} from '../lang';
import {displayModal} from '../common/prompt_modal';
import {ModalType} from '../common/modal_slice';
import {isLocalStorageEnabled} from '../common/utils';
import {DeferredPromise} from '../utils/app';

export function* bufferGitSyncSagas() {
    yield* takeEvery(bufferGitPull, function* ({payload: {bufferName}}) {
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
                revision: gitSync.revision,
            })) as {content: string, revision: string};

            const newGitSync: GitSyncParams = {
                ...gitSync,
                loading: false,
                revision: gitPullResult.revision,
            };

            yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));

            const document = TextBufferHandler.documentFromString(gitPullResult.content);
            yield* put(bufferResetDocument({buffer: bufferName, document, goToEnd: true}));
        } catch (e: any) {
            console.error(e);
            yield* put(stepperDisplayError(getMessage('GIT_ERROR_PULL').s));

            const newGitSync: GitSyncParams = {
                ...gitSync,
                loading: false,
            };

            yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
        }
    });

    yield* takeEvery(bufferGitPush, function* ({payload: {bufferName}}) {
        const state = yield* appSelect();
        const bufferState = state.buffers.buffers[bufferName];
        const {gitSync} = bufferState;

        let gitUsername = null;
        if (isLocalStorageEnabled() && localStorage.getItem('git_username')) {
            gitUsername = localStorage.getItem('git_username');
        } else {
            const deferredPromise = new DeferredPromise();

            yield* put(displayModal({
                message: getMessage('GIT_TYPE_USERNAME').s,
                mode: ModalType.input,
                callback: (newGitUsername: string) => {
                    gitUsername = newGitUsername;
                    deferredPromise.resolve();
                },
            }));

            yield deferredPromise.promise;

            if (isLocalStorageEnabled()) {
                localStorage.setItem('git_username', gitUsername);
            }
        }

        const newGitSync: GitSyncParams = {
            ...gitSync,
            loading: true,
        }

        yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));

        const content = documentToString(bufferState.document);

        try {
            const gitPushResult = (yield* call(asyncRequestJson, state.options.taskPlatformUrl + '/git/push', {
                repository: gitSync.repository,
                branch: gitSync.branch,
                file: gitSync.file,
                revision: gitSync.revision,
                username: gitUsername,
                source: content,
            })) as {revision: string};

            const newGitSync: GitSyncParams = {
                ...gitSync,
                loading: false,
                revision: gitPushResult.revision,
            };

            yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
        } catch (e: any) {
            console.error(e);
            yield* put(stepperDisplayError(getMessage('GIT_ERROR_PUSH').s));

            const newGitSync: GitSyncParams = {
                ...gitSync,
                loading: false,
            };

            yield* put(bufferInit({buffer: bufferName, gitSync: newGitSync}));
        }
    });
}
