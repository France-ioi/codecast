import React from "react";
import {AnchorButton, Button, Callout, Icon, InputGroup, Intent, Label, Spinner} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {formatTime} from "../common/utils";
import {FullWaveform} from "./waveform/FullWaveform";
import {ActionTypes} from "./actionTypes";
import {useAppSelector} from "../hooks";
import {useDispatch} from "react-redux";
import {EditorSaveState} from "./index";
import {getMessage} from "../lang";

interface EditorOverviewProps {
    withoutWaveform?: boolean,
}

export function EditorOverview(props: EditorOverviewProps) {
    const editor = useAppSelector(state => state.editor);

    const {version, name, events} = editor.data;
    const playerUrl = editor.playerUrl;
    const canSave = editor.canSave;
    const save = editor.save;
    const duration = editor.duration;
    const waveform = editor.waveform;
    const dispatch = useDispatch();

    const _saveAudio = () => {
        dispatch({type: ActionTypes.EditorSaveAudio});
    };
    const _nameChanged = (event) => {
        const value = event.target.value;

        dispatch({type: ActionTypes.EditorPropertyChanged, payload: {key: 'name', value: value}});
    };
    const _save = () => {
        dispatch({type: ActionTypes.EditorSave});
    };

    return (
        <div className='vbox'>
            <Label>
                {getMessage('EDITOR_RECORDING_NAME')}
                <input
                    type='text'
                    placeholder="Name"
                    className='bp3-input bp3-fill'
                    value={name || ''}
                    onChange={_nameChanged}
                />
            </Label>
            <Label>
                {getMessage('EDITOR_RECORDING_URL')}
                <InputGroup
                    leftIcon={IconNames.LINK}
                    type='text'
                    value={playerUrl}
                    readOnly
                    rightElement={<AnchorButton href={playerUrl} icon={IconNames.PLAY} minimal target='_blank' rel="noreferrer"/>}
                />
            </Label>
            {/* list of available subtitles? */}
            <div>
                {!props.withoutWaveform && <FullWaveform width={760} height={80} duration={duration} waveform={waveform} events={events}/>}
                <div className='hbox mb'>
                    <div className='fill'>{getMessage('EDITOR_VERSION')} <b>{version}</b></div>
                    <div className='fill'>{getMessage('EDITOR_DURATION')} <b>{formatTime(duration)}</b></div>
                    <div className='fill'>{getMessage('EDITOR_EVENTS')} <b>{events.length}</b></div>
                </div>
            </div>
            <div className='hbox mb' style={{textAlign: 'center', backgroundColor: '#efefef', padding: '10px'}}>
                <div className='fill center'>
                    <Button onClick={_saveAudio} icon={IconNames.DOWNLOAD} text={getMessage('EDITOR_DOWNLOAD_AUDIO')} className="mr-2"/>
                    <Button onClick={_save} icon={IconNames.CLOUD_UPLOAD} text={getMessage('EDITOR_SAVE')} disabled={!canSave} intent={Intent.PRIMARY}/>
                </div>
            </div>
            {!canSave &&
                <Callout intent={Intent.WARNING} title={getMessage('EDITOR_CANNOT_SAVE_TITLE')}>
                    {getMessage('EDITOR_CANNOT_SAVE_MESSAGE')}
                </Callout>
            }
            {save &&
                <div className='vbox'>
                    {save.state === EditorSaveState.Pending &&
                        <div className='fill'>
                            <Spinner size={Spinner.SIZE_SMALL} />
                            {getMessage('EDITOR_SAVING')}
                        </div>
                    }
                    {save.state === EditorSaveState.Failure &&
                        <div className='fill'>
                            <Icon icon='cross' intent={Intent.DANGER} />
                            {getMessage('EDITOR_SAVE_ERROR')}{save.error}
                        </div>
                    }
                    {save.state === EditorSaveState.Success &&
                        <div className='fill'>
                            <Icon icon='tick' intent={Intent.SUCCESS} />
                            {getMessage('EDITOR_SAVED')}
                        </div>
                    }
                </div>
            }
        </div>
    );
}
