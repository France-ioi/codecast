import React, {useEffect, useState} from "react";
import {
    AnchorButton,
    Button,
    ControlGroup,
    FormGroup,
    HTMLSelect,
    Icon,
    InputGroup,
    Intent,
    ProgressBar,
    Spinner
} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {useDispatch} from "react-redux";
import {SaveStep} from "./save_screen";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";
import {IconNames} from '@blueprintjs/icons';

interface SaveScreenProps {
    onCancel?: () => void,
}

export function SaveScreen(props: SaveScreenProps) {
    const grants = useAppSelector(state => state.user ? state.user.grants : []);
    const {step, progress, audioUrl, wavAudioUrl, eventsUrl, playerUrl, editorUrl, error} = useAppSelector(state => state.save);
    const ltiUrl = `https://lti.algorea.org/?taskUrl=${encodeURIComponent(playerUrl)}`;

    const dispatch = useDispatch();

    const [targetUrl, setTargetUrl] = useState('');
    const grantOptions = grants.map(({url, description}) => ({value: url, label: description}));
    let message = null, canUpload = false, busy = false;
    switch (step) {
        case SaveStep.EncodingPending:
            message = getMessage('ENCODING_IN_PROGRESS');
            busy = true;
            // PROGRESS
            break;
        case SaveStep.EncodingDone:
            message = getMessage('ENCODING_COMPLETE');
            canUpload = true;
            break;
        case SaveStep.UploadPreparing:
            message = getMessage('UPLOADING_PREPARING');
            busy = true;
            break;
        case SaveStep.UploadEventsPending:
            message = getMessage('UPLOADING_EVENTS');
            busy = true;
            break;
        case SaveStep.UploadEventsDone:
            message = getMessage('UPLOADING_EVENTS_DONE');
            break;
        case SaveStep.UploadAudioPending:
            message = getMessage('UPLOADING_AUDIO');
            busy = true;
            break;
        case SaveStep.UploadAudioDone:
            message = getMessage('UPLOADING_AUDIO_DONE');
            break;
        case SaveStep.Done:
            message = getMessage('UPLOADING_COMPLETE');
            break;
        case SaveStep.Error:
            message = (
                <div>
                    <p>{getMessage('UPLOADING_ERROR')}</p>
                    <pre>{error.stack}</pre>
                </div>
            );
            canUpload = true; // allow retry
            break;
    }

    useEffect(() => {
        if ((!targetUrl || !grants.find(grant => grant.url === targetUrl)) && grants.length) {
            setTargetUrl(grants[0].url);
        }
    }, [grants]);

    const handleTargetChange = (event) => {
        setTargetUrl(event.target.value);
    };

    const handleFocus = (event) => event.target.select();

    const onUpload = () => {
        const grant = grants.find(grant => grant.url === targetUrl);
        if (grant) {
            dispatch({type: ActionTypes.SaveScreenUpload, payload: {target: grant}});
        }
    };

    const onChangeUser = () => {
        dispatch({type: CommonActionTypes.LogoutFeedback});
    };

    /* TODO: select target among user grants */
    return (
        <form className="save-screen">
            <FormGroup labelFor='eventsUrlInput' label={getMessage('UPLOADING_URL_EVENTS')}>
                <input
                    id='eventsUrlInput'
                    type='text'
                    className='bp4-input bp4-fill'
                    value={eventsUrl || ''}
                    readOnly
                    onFocus={handleFocus}
                />
            </FormGroup>
            <FormGroup labelFor='audioUrlInput' label={getMessage('UPLOADING_URL_AUDIO_MP3')}>
                <input
                    id='audioUrlInput'
                    type='text'
                    className='bp4-input bp4-fill'
                    value={audioUrl || ''}
                    readOnly
                    onFocus={handleFocus}
                />
            </FormGroup>
            {wavAudioUrl &&
            <FormGroup labelFor='wavAudioUrlInput' label={getMessage('UPLOADING_URL_AUDIO_WAV')}>
                <input
                    id='wavAudioUrlInput'
                    type='text'
                    className='bp4-input bp4-fill'
                    value={wavAudioUrl || ''}
                    readOnly
                    onFocus={handleFocus}
                />
            </FormGroup>}
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
            <div className="encoding-status">
                {busy ?
                    <Spinner size={20} className="mr-2" />
                    : (step === SaveStep.Done ?
                        <Icon icon='tick' intent={Intent.SUCCESS} />
                        : null)}

                {message}
            </div>
            {typeof progress === 'number' && SaveStep.Done !== step &&
                <ProgressBar value={progress}/>
            }
            <div className="mt-4">
                {canUpload && <Button
                    onClick={onUpload}
                    intent={canUpload ? Intent.PRIMARY : Intent.NONE}
                    icon='floppy-disk'
                    className="mr-2"
                    text={getMessage('UPLOADING_BUTTON')}
                />}
                {SaveStep.Done !== step &&
                    <Button
                        onClick={props.onCancel}
                        intent={Intent.DANGER}
                        icon={'trash'}
                        text={getMessage('DELETE_RECORDING')}
                    />
                }
            </div>

            {playerUrl &&
                <FormGroup labelFor='playerUrlInput' label={getMessage('PLAYBACK_LINK')} className="mt-4">
                    <InputGroup
                        leftIcon={IconNames.LINK}
                        type='text'
                        value={playerUrl}
                        readOnly
                        onFocus={handleFocus}
                        rightElement={<AnchorButton href={playerUrl} icon={IconNames.PLAY} minimal target='_blank' rel="noreferrer"/>}
                    />
                </FormGroup>
            }

            {editorUrl &&
                <FormGroup labelFor='editorUrlInput' label={getMessage('EDITOR_LINK')} className="mt-4">
                    <InputGroup
                        leftIcon={IconNames.LINK}
                        type='text'
                        value={editorUrl}
                        readOnly
                        onFocus={handleFocus}
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
                        onFocus={handleFocus}
                        rightElement={<AnchorButton href={ltiUrl} icon={IconNames.PLAY} minimal target='_blank' rel="noreferrer"/>}
                    />
                </FormGroup>
            }
        </form>
    );
}
