import React, {useState} from "react";
import {
    AnchorButton,
    Button,
    Callout,
    ControlGroup,
    FormGroup,
    HTMLSelect,
    Icon,
    InputGroup,
    Intent,
    Label,
    ProgressBar,
    Spinner
} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {formatTime} from "../common/utils";
import {ActionTypes} from "./actionTypes";
import {useAppSelector} from "../hooks";
import {useDispatch} from "react-redux";
import {LoginScreen} from "../common/LoginScreen";
import {EditorSaveState} from "./index";
import {getMessage} from "../lang";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {parseCodecastUrl} from '../common/options';

export function EditorSave() {
    const editor = useAppSelector(state => state.editor);
    const user = useAppSelector(state => state.user);

    const {version, name, events} = editor.data;
    const playerUrl = editor.playerUrl;
    const editorUrl = editor.editorUrl;
    const ltiUrl = `https://lti.algorea.org/?taskUrl=${encodeURIComponent(playerUrl)}`;
    const canSave = editor.canSave;
    const save = editor.save;
    const duration = editor.duration;
    const dispatch = useDispatch();
    const progress = save.progress;

    const grants = user ? user.grants : [];
    const grantOptions = grants.map(({url, description}) => ({value: url, label: description}));
    const [targetUrl, setTargetUrl] = useState('');

    const _nameChanged = (event) => {
        const value = event.target.value;

        dispatch({type: ActionTypes.EditorPropertyChanged, payload: {key: 'name', value: value}});
    };
    const _save = () => {
        const grant = grants.find(grant => grant.url === targetUrl);
        const currentUrlParsed = parseCodecastUrl(editor.base);
        if (grant) {
            const sameTarget = grant.s3Bucket === currentUrlParsed.s3Bucket && grant.uploadPath === currentUrlParsed.uploadPath;
            if (!sameTarget || editor.trim.unsaved) {
                dispatch({type: ActionTypes.EditorTrimSave, payload: {target: grant}});
            } else {
                dispatch({type: ActionTypes.EditorSave, payload: {target: grant}});
            }
        }
    };
    const handleTargetChange = (event) => {
        setTargetUrl(event.target.value);
    };

    const onChangeUser = () => {
        dispatch({type: CommonActionTypes.LogoutFeedback});
    };

    if ((!targetUrl || !grants.find(grant => grant.url === targetUrl)) && grants.length) {
        setTargetUrl(grants[0].url);
    }

    if (!user) {
        return (<LoginScreen/>);
    }

    return (
        <div className='vbox'>
            <div className="mb-4">
                <div className='hbox mb'>
                    <div className='fill'>{getMessage('EDITOR_VERSION')} <b>{version}</b></div>
                    <div className='fill'>{getMessage('EDITOR_DURATION')} <b>{formatTime(duration)}</b></div>
                    <div className='fill'>{getMessage('EDITOR_EVENTS')} <b>{events.length}</b></div>
                </div>
            </div>
            <Label>
                {getMessage('EDITOR_RECORDING_NAME')}
                <input
                    type='text'
                    placeholder="Name"
                    className='bp4-input bp4-fill'
                    value={name || ''}
                    onChange={_nameChanged}
                />
            </Label>

            <FormGroup label={getMessage('UPLOADING_TARGET')}>
                <ControlGroup>
                    <HTMLSelect options={grantOptions} value={targetUrl} onChange={handleTargetChange}/>
                    <Button
                        onClick={onChangeUser}
                        intent={Intent.NONE}
                        icon='user'
                        className="ml-2"
                        text={getMessage('USER_CHANGE_USER')}
                    />
                </ControlGroup>
            </FormGroup>
            <div className='mt-2 mb-4'>
                <Button onClick={_save} icon={IconNames.CLOUD_UPLOAD} text={getMessage('EDITOR_SAVE')} disabled={!canSave} intent={Intent.PRIMARY} className="mr-2"/>
            </div>
            {!canSave &&
                <Callout intent={Intent.WARNING} title={getMessage('EDITOR_CANNOT_SAVE_TITLE')} className="mb-4">
                    {getMessage('EDITOR_CANNOT_SAVE_MESSAGE')}
                </Callout>
            }
            {save && save.state !== EditorSaveState.Idle &&
                <div className='vbox mb-4'>
                    {typeof progress === 'number' && EditorSaveState.Pending === save.state &&
                        <ProgressBar value={progress} className="mb-2"/>
                    }

                    {save.state === EditorSaveState.Pending &&
                        <div className='encoding-status fill'>
                            <Spinner size={20} className="mr-2 save-spinner"/>
                            {getMessage(save.step ? `UPLOADING_${save.step.toLocaleUpperCase()}` : 'EDITOR_SAVING')}
                        </div>
                    }
                    {save.state === EditorSaveState.Failure &&
                        <div className='encoding-status fill'>
                            <Icon icon='cross' intent={Intent.DANGER} className="mr-2" />
                            {getMessage('EDITOR_SAVE_ERROR')}{save.error}
                        </div>
                    }
                    {save.state === EditorSaveState.Success &&
                        <div className='encoding-status fill'>
                            <Icon icon='tick' intent={Intent.SUCCESS} className="mr-2" />
                            {getMessage('EDITOR_SAVED')}
                        </div>
                    }
                </div>
            }

            {playerUrl &&
                <FormGroup labelFor='playerUrlInput' label={getMessage('PLAYBACK_LINK')} className="mt-4">
                    <InputGroup
                        leftIcon={IconNames.LINK}
                        type='text'
                        value={playerUrl}
                        readOnly
                        rightElement={<AnchorButton href={playerUrl} icon={IconNames.PLAY} minimal target='_blank' rel="noreferrer"/>}
                    />
                </FormGroup>
            }

            {editorUrl &&
                <FormGroup labelFor='editorUrlInput' label={getMessage('EDITOR_LINK')} className="mt-2">
                    <InputGroup
                        leftIcon={IconNames.LINK}
                        type='text'
                        value={editorUrl}
                        readOnly
                        rightElement={<AnchorButton href={editorUrl} icon={IconNames.EDIT} minimal target='_blank' rel="noreferrer"/>}
                    />
                </FormGroup>
            }

            {playerUrl &&
                <FormGroup labelFor='ltiUrlInput' label={getMessage('LTI_LINK')} className="mt-4">
                    <InputGroup
                        leftIcon={IconNames.LINK}
                        type='text'
                        value={ltiUrl}
                        readOnly
                        rightElement={<AnchorButton href={ltiUrl} icon={IconNames.PLAY} minimal target='_blank' rel="noreferrer"/>}
                    />
                </FormGroup>
            }
        </div>
    );
}
