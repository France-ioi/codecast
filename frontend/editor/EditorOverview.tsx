import React from "react";
import {AnchorButton, Button, Callout, Icon, InputGroup, Intent, Label, Spinner} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {formatTime} from "../common/utils";
import {FullWaveform} from "./waveform/FullWaveform";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface EditorOverviewStateToProps {
    version: string,
    name: string,
    events: any,
    duration: number,
    waveform: any,
    save: any,
    playerUrl: string,
    canSave: boolean
}

function mapStateToProps(state: AppStore): EditorOverviewStateToProps {
    const editor = state.editor;
    const playerUrl = editor.playerUrl;
    const {version, name, events} = editor.data;
    const canSave = editor.canSave;
    const save = editor.save;
    const duration = editor.duration;
    const waveform = editor.waveform;

    return {version, name, events, duration, waveform, canSave, save, playerUrl};
}

interface EditorOverviewDispatchToProps {
    dispatch: Function
}

interface EditorOverviewProps extends EditorOverviewStateToProps, EditorOverviewDispatchToProps {

}

class _EditorOverview extends React.PureComponent<EditorOverviewProps> {
    render() {
        const {version, name, events, duration, waveform, save, playerUrl, canSave} = this.props;
        return (
            <div className='vbox'>
                <Label>
                    Name
                    <input
                        type='text'
                        placeholder="Name"
                        className='bp3-input bp3-fill'
                        value={name || ''}
                        onChange={this._nameChanged}
                    />
                </Label>
                <Label>
                    Player URL
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
                    <FullWaveform width={760} height={80} duration={duration} waveform={waveform} events={events} />
                    <div className='hbox mb'>
                        <div className='fill'>{"Version "}<b>{version}</b></div>
                        <div className='fill'>{"Duration "}<b>{formatTime(duration)}</b></div>
                        <div className='fill'>{"Number of events "}<b>{events.length}</b></div>
                    </div>
                </div>
                <div className='hbox mb' style={{textAlign: 'center', backgroundColor: '#efefef', padding: '10px'}}>
                    <div className='fill center'>
                        <Button onClick={this._saveAudio} icon={IconNames.DOWNLOAD} text={"Save audio"}/>
                        <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"} disabled={!canSave}/>
                    </div>
                </div>
                {!canSave &&
                    <Callout intent={Intent.WARNING} title={"Insufficient access rights"}>
                        {"The current user is not allowed to modify this Codecast."}
                    </Callout>
                }
                {save &&
                    <div className='vbox'>
                        {save.state === 'pending' &&
                            <div className='fill'>
                                <Spinner size={Spinner.SIZE_SMALL} />
                                {"Saving, please wait…"}
                            </div>
                        }
                        {save.state === 'failure' &&
                            <div className='fill'>
                                <Icon icon='cross' intent={Intent.DANGER} />
                                {"Failed to save: "}{save.error}
                            </div>
                        }
                        {save.state === 'success' &&
                            <div className='fill'>
                                <Icon icon='tick' intent={Intent.SUCCESS} />
                                {"Saved."}
                            </div>
                        }
                    </div>
                }
            </div>
        );
    }

    _saveAudio = () => {
        const {dispatch} = this.props;

        dispatch({type: ActionTypes.EditorSaveAudio});
    };
    _nameChanged = (event) => {
        const {dispatch} = this.props;
        const value = event.target.value;

        dispatch({type: ActionTypes.EditorPropertyChanged, payload: {key: 'name', value: value}});
    };
    _save = () => {
        const {dispatch} = this.props;

        dispatch({type: ActionTypes.EditorSave});
    };
}

export const EditorOverview = connect(mapStateToProps)(_EditorOverview);
