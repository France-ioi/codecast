import {Button, Dialog, FormGroup, InputGroup, Intent} from "@blueprintjs/core";
import React, {FormEvent, useState} from "react";
import {useDispatch} from "react-redux";
import {useAppSelector} from '../hooks';
import {getMessage} from '../lang';
import {isLocalStorageEnabled} from '../common/utils';
import {bufferGitPush} from './buffer_actions';
import {GitSyncParams} from './buffer_types';
import {bufferInit} from './buffers_slice';
import {IconNames} from '@blueprintjs/icons';

export function GitCommitDialog({bufferName}: {bufferName: string}) {
    const gitSync = useAppSelector(state => state.buffers.buffers[bufferName].gitSync);
    const dispatch = useDispatch();
    const [gitUsername, setGitUsername] = useState<string>(isLocalStorageEnabled() && localStorage.getItem('git_username') ? localStorage.getItem('git_username') : '');
    const [gitCommitMessage, setGitCommitMessage] = useState<string>('');

    const doGitPush = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        dispatch(bufferGitPush(bufferName, gitCommitMessage, gitUsername));
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
                <form onSubmit={doGitPush}>
                    <FormGroup labelFor='gitMessage' label={getMessage('GIT_COMMIT_MESSAGE')}>
                        <InputGroup
                            leftIcon={IconNames.Comment}
                            type='text'
                            value={gitCommitMessage}
                            required
                            onChange={(e) => setGitCommitMessage(e.target.value)}
                        />
                    </FormGroup>
                    <FormGroup labelFor='gitUsername' label={getMessage('GIT_USERNAME')}>
                        <InputGroup
                            leftIcon={IconNames.User}
                            type='text'
                            value={gitUsername}
                            required
                            onChange={(e) => setGitUsername(e.target.value)}
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
