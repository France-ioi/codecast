import {Button, Dialog, FormGroup, Intent, TextArea} from "@blueprintjs/core";
import React, {FormEvent, useState} from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from '../hooks';
import {getMessage} from '../lang';
import {bufferGitPull} from './buffer_actions';
import {GitSyncParams} from './buffer_types';
import {bufferInit} from './buffers_slice';

export function GitResolveConflictsDialog({bufferName}: {bufferName: string}) {
    const gitSync = useAppSelector(state => state.buffers.buffers[bufferName].gitSync);
    const dispatch = useDispatch();
    const [source, setSource] = useState<string>(gitSync.conflictedSource);

    const doGitPull = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        dispatch(bufferGitPull(bufferName, source, gitSync.conflictedRevision));
    };

    const closeCommitDialog = () => {
        const newGitSync: GitSyncParams = {
            ...gitSync,
            commitModalOpen: false,
        };
        dispatch(bufferInit({buffer: bufferName, gitSync: newGitSync}));
    };

    return (
        <Dialog
            icon="menu"
            title={getMessage('GIT_PUSH_LABEL')}
            isOpen={true}
            canOutsideClickClose={true}
            canEscapeKeyClose={true}
            isCloseButtonShown={true}
            onClose={closeCommitDialog}
        >
            <div className='bp4-dialog-body'>
                <form onSubmit={doGitPull}>
                    <p>solve conflicts</p>
                    <FormGroup>
                        <TextArea
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                        />
                    </FormGroup>
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
