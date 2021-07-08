import React from "react";
import {Button, FormGroup, HTMLSelect, Icon, Intent, ProgressBar, Spinner} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {SaveStep} from "./save_screen";

interface SaveScreenStateToProps {
    getMessage: Function,
    grants: any,
    audioUrl: string,
    wavAudioUrl: string,
    eventsUrl: string,
    playerUrl: string,
    editorUrl: string,
    step: string,
    error: any,
    progress: any
}

function mapStateToProps(state: AppStore): SaveScreenStateToProps {
    const getMessage = state.getMessage;
    const grants = (state.user) ? state.user.grants : [];
    const {step, progress, audioUrl, wavAudioUrl, eventsUrl, playerUrl, editorUrl, error} = state.save;

    return {getMessage, grants, step, progress, audioUrl, wavAudioUrl, eventsUrl, playerUrl, editorUrl, error};
}

interface SaveScreenDispatchToProps {
    dispatch: Function
}

interface SaveScreenProps extends SaveScreenStateToProps, SaveScreenDispatchToProps {
    onCancel?: () => void,
}

export class _SaveScreen extends React.PureComponent<SaveScreenProps> {
    render() {
        const {getMessage, grants} = this.props;
        const {audioUrl, wavAudioUrl, eventsUrl, playerUrl, editorUrl, step, error, progress} = this.props;
        const {targetUrl} = this.state;
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

        /* TODO: select target among user grants */
        return (
            <form className="save-screen">
                <FormGroup labelFor='eventsUrlInput' label={getMessage('UPLOADING_URL_EVENTS')}>
                    <input
                        id='eventsUrlInput'
                        type='text'
                        className='bp3-input bp3-fill'
                        value={eventsUrl || ''}
                        readOnly
                        onFocus={this.handleFocus}
                    />
                </FormGroup>
                <FormGroup labelFor='audioUrlInput' label={getMessage('UPLOADING_URL_AUDIO_MP3')}>
                    <input
                        id='audioUrlInput'
                        type='text'
                        className='bp3-input bp3-fill'
                        value={audioUrl || ''}
                        readOnly
                        onFocus={this.handleFocus}
                    />
                </FormGroup>
                {wavAudioUrl &&
                <FormGroup labelFor='wavAudioUrlInput' label={getMessage('UPLOADING_URL_AUDIO_WAV')}>
                    <input
                        id='wavAudioUrlInput'
                        type='text'
                        className='bp3-input bp3-fill'
                        value={wavAudioUrl || ''}
                        readOnly
                        onFocus={this.handleFocus}
                    />
                </FormGroup>}
                <FormGroup label={getMessage('UPLOADING_TARGET')}>
                    <HTMLSelect options={grantOptions} value={targetUrl} onChange={this.handleTargetChange}/>
                </FormGroup>
                <div className="encoding-status">
                    {busy ?
                        <Spinner size={Spinner.SIZE_SMALL} className="mr-2" />
                    : (step === 'done' ?
                        <Icon icon='tick' intent={Intent.SUCCESS} />
                    : null)}

                    {message}
                </div>
                {typeof progress === 'number' && 'done' !== step &&
                    <ProgressBar value={progress}/>
                }
                <div className="mt-4">
                    {canUpload && <Button
                        onClick={this.onUpload}
                        intent={canUpload ? Intent.PRIMARY : Intent.NONE}
                        icon='floppy-disk'
                        className="mr-2"
                        text={getMessage('UPLOADING_BUTTON')}
                    />}
                    {'done' !== step &&
                        <Button
                          onClick={this.props.onCancel}
                          intent={Intent.DANGER}
                          icon={'trash'}
                          text={getMessage('DELETE_RECORDING')}
                        />
                    }
                    {'done' === step &&
                        <Button
                          onClick={this.props.onCancel}
                          intent={Intent.NONE}
                          icon="cross"
                          text={getMessage('CLOSE')}
                        />
                    }
                </div>

                {playerUrl &&
                    <FormGroup labelFor='playerUrlInput' label={getMessage('PLAYBACK_LINK')} className="mt-4">
                        <input id='playerUrlInput' type='text' className='bp3-input bp3-fill' value={playerUrl} readOnly onFocus={this.handleFocus}/>
                    </FormGroup>
                }

                {editorUrl &&
                    <FormGroup labelFor='editorUrlInput' label={getMessage('EDITOR_LINK')} className="mt-4">
                      <input id='editorUrlInput' type='text' className='bp3-input bp3-fill' value={editorUrl} readOnly onFocus={this.handleFocus}/>
                    </FormGroup>
                }
            </form>
        );
    }

    static getDerivedStateFromProps(props, state) {
        /* Default to first valid grant. */
        if (!state.targetUrl) {
            return {targetUrl: props.grants[0].url};
        }
        return null;
    }

    state = {targetUrl: ''};

    handleTargetChange = (event) => {
        this.setState({targetUrl: event.target.value});
    };

    handleFocus = (event) => event.target.select();

    onUpload = () => {
        const {targetUrl} = this.state;
        const grant = this.props.grants.find(grant => grant.url === targetUrl);

        if (grant) {
            this.props.dispatch({type: ActionTypes.SaveScreenUpload, payload: {target: grant}});
        }
    };
}

export const SaveScreen = connect(mapStateToProps)(_SaveScreen);
