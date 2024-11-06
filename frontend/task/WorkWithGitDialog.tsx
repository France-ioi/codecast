import {Button, Dialog, FormGroup, InputGroup, Intent, Menu, MenuItem, Spinner} from "@blueprintjs/core";
import React, {useEffect, useState} from "react";
import {getMessage} from "../lang";
import {IconNames} from '@blueprintjs/icons';
import {useAppSelector} from '../hooks';
import {selectActiveBuffer} from '../buffers/buffer_selectors';
import {GitSyncParams} from '../buffers/buffer_types';
import {asyncGetJson, asyncRequestJson} from '../utils/api';
import {ItemPredicate, Select2} from '@blueprintjs/select';
import {useDispatch} from 'react-redux';
import {bufferCreateSourceBuffer} from '../buffers/buffer_actions';
import {TextBufferHandler} from '../buffers/document';

interface WorkWithGitDialogProps {
    open: boolean,
    onClose: () => void,
}

enum GitSyncStep {
    CHOOSE_REPOSITORY = 0,
    CHOOSE_BRANCH = 1,
}

interface FileElement {
    name: string,
    directory: boolean,
}

export function WorkWithGitDialog(props: WorkWithGitDialogProps) {
    const activeBuffer = useAppSelector(selectActiveBuffer);
    const options = useAppSelector(state => state.options);

    const [gitSync, changeGitSync] = useState<GitSyncParams>(activeBuffer?.gitSync ?? {
        repository: '',
        branch: null,
        file: null,
        revision: null,
    });

    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);
    const [validatingSync, setValidatingSync] = useState(false);
    const [error, setError] = useState(null);
    const [filesList, setFilesList] = useState<FileElement[]>([]);
    const [activeFolder, setActiveFolder] = useState<string>(null);
    const dispatch = useDispatch();
    const [step, setStep] = useState(GitSyncStep.CHOOSE_REPOSITORY);

    const changeGitSyncParameter = (param: string, value: string) => {
        changeGitSync((previousGitSync) => ({
            ...previousGitSync,
            [param]: value,
        }));
    };

    const getRepositoryBranches = async () => {
        if (!/[a-z0-9]+@.+\.git/.test(gitSync.repository)) {
            setError(getMessage('GIT_ERROR_REPOSITORY_FORMAT'));
            return;
        }

        setLoadingBranches(true);
        setError(null);

        try {
            const repoBranchesResult = (await asyncGetJson(options.taskPlatformUrl + '/git/repository-branches', {repository: gitSync.repository})) as {branches: string[]};
            const branches = repoBranchesResult.branches;

            setAvailableBranches(branches);
            setStep(GitSyncStep.CHOOSE_BRANCH);
        } catch (e: any) {
            console.error(e);

            let errorMessage = getMessage('GIT_ERROR_BRANCHES');
            if (e?.res?.body?.publicKey) {
                errorMessage = `${errorMessage} ${getMessage('GIT_ADD_SSH_KEY')}\n${e?.res?.body?.publicKey}`;
            }
            setError(errorMessage);
        } finally {
            setLoadingBranches(false);
        }
    };

    const cancelRepository = () => {
        setStep(GitSyncStep.CHOOSE_REPOSITORY);
        setAvailableBranches([]);
        changeGitSyncParameter('branch', null);
        changeGitSyncParameter('revision', null);
        changeGitSyncParameter('file', null);
        setFilesList([]);
    };

    const filterBranch: ItemPredicate<string> = (query, branch, _index, exactMatch) => {
        const normalizedTitle = branch.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (exactMatch) {
            return normalizedTitle === normalizedQuery;
        } else {
            return branch.indexOf(normalizedQuery) >= 0;
        }
    };

    const getRepositoryFolderContent = async () => {
        setLoadingContent(true);
        setError(null);

        try {
            const folderContentResult = (await asyncGetJson(options.taskPlatformUrl + '/git/repository-folder-content', {
                repository: gitSync.repository,
                branch: gitSync.branch,
                folder: activeFolder,
            })) as {content: {name: string, directory: boolean}[]};

            setFilesList(folderContentResult.content);
        } catch (e: any) {
            console.error(e);
            setError(getMessage('GIT_ERROR_CONTENT'));
        } finally {
            setLoadingContent(false);
        }
    };

    useEffect(() => {
        if (gitSync.repository && gitSync.branch) {
            getRepositoryFolderContent();
        }
    }, [gitSync.branch, activeFolder]);

    const makeSync = async () => {
        setValidatingSync(true);
        setError(null);

        try {
            const gitPullResult = (await asyncRequestJson(options.taskPlatformUrl + '/git/pull', {
                repository: gitSync.repository,
                branch: gitSync.branch,
                file: gitSync.file,
            })) as { content: string, revision: string };

            const document = TextBufferHandler.documentFromString(gitPullResult.content);

            dispatch(bufferCreateSourceBuffer(document, null, {
                gitSync: {
                    ...gitSync,
                    revision: gitPullResult.revision,
                },
            }));
            props.onClose();
        } catch (e: any) {
            console.error(e);
            setError(getMessage('GIT_ERROR_CONTENT'));
        } finally {
            setValidatingSync(false);
        }
    };

    const clickFileElement = (fileElement: FileElement) => {
        const newPath = activeFolder ? activeFolder + '/' + fileElement.name : fileElement.name;
        if (fileElement.directory) {
            setActiveFolder(newPath);
        } else {
            changeGitSyncParameter('file', newPath);
        }
    }

    return (
        <Dialog
            icon="menu"
            title={getMessage('MENU_SYNC_GIT')}
            isOpen={props.open}
            onClose={props.onClose}
            canEscapeKeyClose={true}
            canOutsideClickClose={true}
            isCloseButtonShown={true}
        >
            <div className='bp4-dialog-body'>
                <FormGroup labelFor='gitRepository' label={getMessage('GIT_REPOSITORY')}>
                    <InputGroup
                        leftIcon={IconNames.GitRepo}
                        type='text'
                        placeholder={"git@github.com:..."}
                        value={gitSync.repository}
                        readOnly={step > GitSyncStep.CHOOSE_REPOSITORY}
                        autoFocus
                        onChange={(e) => changeGitSyncParameter('repository', e.target.value)}
                    />
                </FormGroup>
                {step >= GitSyncStep.CHOOSE_BRANCH && <FormGroup labelFor='gitBranch' label={getMessage('GIT_BRANCH')}>
                    <div style={{display: 'inline-block'}}>
                        <Select2
                            items={availableBranches}
                            itemPredicate={filterBranch}
                            itemRenderer={(branch, {modifiers, handleFocus, handleClick}) =>
                                <MenuItem
                                    active={modifiers.active}
                                    disabled={modifiers.disabled}
                                    key={branch}
                                    onClick={handleClick}
                                    onFocus={handleFocus}
                                    roleStructure="listoption"
                                    text={branch}
                                />
                            }
                            noResults={<MenuItem disabled={true} text={getMessage('GIT_BRANCH_NO_RESULT')} roleStructure="listoption" />}
                            onItemSelect={(e) => changeGitSyncParameter('branch', e)}
                        >
                            <Button
                                icon={IconNames.GitBranch}
                                rightIcon="caret-down"
                                text={gitSync.branch ?? getMessage('SELECT') + '...'}
                            />
                        </Select2>
                    </div>
                </FormGroup>}
                {step >= GitSyncStep.CHOOSE_BRANCH && gitSync.branch && <FormGroup labelFor='gitFile' label={getMessage('GIT_FILE')}>
                    <div className="project-structure">
                        {loadingContent ? <div className="project-structure-loading">
                            <Spinner size={40}/>
                        </div>
                            :
                            <Menu>
                                {activeFolder && <MenuItem
                                    key={null}
                                    icon={IconNames.FolderClose}
                                    onClick={() => setActiveFolder(activeFolder.split('/').slice(0, -1).join('/'))}
                                    roleStructure="listoption"
                                    text={'..'}
                                />}
                                {filesList.map((fileElement, index) =>
                                    <MenuItem
                                        key={index}
                                        icon={fileElement.directory ? IconNames.FolderClose : IconNames.Document}
                                        onClick={() => clickFileElement(fileElement)}
                                        roleStructure="listoption"
                                        active={gitSync.file === (activeFolder ? activeFolder + '/' + fileElement.name : fileElement.name)}
                                        text={fileElement.name}
                                    />
                                )}
                            </Menu>
                        }
                    </div>
                </FormGroup>}
                {error && <div className="generic-error">
                    {error}
                </div>}
                {step === GitSyncStep.CHOOSE_REPOSITORY && <FormGroup className="button-group mt-4">
                    <Button
                        text={getMessage('VALIDATE')}
                        intent={Intent.PRIMARY}
                        onClick={getRepositoryBranches}
                        loading={loadingBranches}
                        disabled={loadingBranches}
                    />
                </FormGroup>}
                {step === GitSyncStep.CHOOSE_BRANCH && <FormGroup className="button-group mt-4">
                    <Button
                        text={getMessage('CANCEL')}
                        intent={Intent.NONE}
                        onClick={cancelRepository}
                    />

                    <Button
                        text={getMessage('VALIDATE')}
                        intent={Intent.PRIMARY}
                        disabled={!gitSync.branch || !gitSync.file || validatingSync}
                        loading={validatingSync}
                        onClick={makeSync}
                    />
                </FormGroup>}
            </div>
        </Dialog>
    );
}
