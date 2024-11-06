import {Button, Dialog, Intent} from "@blueprintjs/core";
import React, {FormEvent} from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from '../hooks';
import {getMessage} from '../lang';
import {GitSyncParams} from './buffer_types';
import {bufferInit, bufferRemove, bufferResetDocument} from './buffers_slice';
import {BufferEditor} from './BufferEditor';
import {platformsList} from '../stepper/platforms';

export function GitResolveConflictsDialog({bufferName}: {bufferName: string}) {
    const bufferState = useAppSelector(state => state.buffers.buffers[bufferName]);
    const conflictBufferState = useAppSelector(state => state.buffers.buffers[bufferState.gitSync.conflictBuffer]);
    const {gitSync} = bufferState;
    const dispatch = useDispatch();

    const validateConflictSolve = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        dispatch(bufferRemove(gitSync.conflictBuffer));

        const newGitSync: GitSyncParams = {
            ...gitSync,
            conflictSource: null,
            conflictBuffer: null,
            conflictRevision: null,
            revision: gitSync.conflictRevision,
        };
        dispatch(bufferInit({buffer: bufferName, gitSync: newGitSync}));
        dispatch(bufferResetDocument({buffer: bufferName, document: conflictBufferState.document}));
    };

    const closeConflictsDialog = () => {
        dispatch(bufferRemove(gitSync.conflictBuffer));

        const newGitSync: GitSyncParams = {
            ...gitSync,
            conflictSource: null,
            conflictBuffer: null,
            conflictRevision: null,
        };
        dispatch(bufferInit({buffer: bufferName, gitSync: newGitSync}));
    };

    const platform = bufferState.platform;
    const sourceMode = platformsList[platform].aceSourceMode;

    return (
        <Dialog
            icon="menu"
            title={getMessage('GIT_RESOLVE_CONFLICTS')}
            isOpen={true}
            canOutsideClickClose={true}
            canEscapeKeyClose={true}
            isCloseButtonShown={true}
            onClose={closeConflictsDialog}
        >
            <div className='bp4-dialog-body'>
                <form onSubmit={validateConflictSolve}>
                    <p>
                        {getMessage('GIT_RESOLVE_CONFLICTS_LABEL')}
                    </p>

                    <div className="git-solve-conflict-editor">
                        <BufferEditor
                            platform={platform}
                            bufferName={gitSync.conflictBuffer}
                            mode={sourceMode}
                            requiredWidth="100%"
                            requiredHeight="100%"
                            hasAutocompletion
                        />
                    </div>

                    <Button
                        text={getMessage('VALIDATE')}
                        intent={Intent.PRIMARY}
                        type="submit"
                        loading={gitSync.loading}
                        disabled={gitSync.loading}
                    />
                </form>
            </div>
        </Dialog>
    );
}
