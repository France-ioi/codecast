import React from "react";
import {Button, FormGroup, HTMLSelect, Icon, Intent, ProgressBar, Spinner} from "@blueprintjs/core";

interface SaveScreenProps {
    getMessage: any,
    grants: any,
    audioUrl: any,
    wavAudioUrl: any,
    eventsUrl: any,
    playerUrl: any,
    step: any,
    error: any,
    progress: any
}

class SaveScreen extends React.PureComponent<SaveScreenProps> {
    render() {
        const {getMessage, grants} = this.props;
        const {audioUrl, wavAudioUrl, eventsUrl, playerUrl, step, error, progress} = this.props;
        const {targetUrl} = this.state;
        const grantOptions = grants.map(({url, description}) => ({value: url, label: description}));
        let message = null, canUpload = false, busy = false;
        switch (step) {
            case 'encoding pending':
                message = "Encoding, please wait…";
                busy = true;
                // PROGRESS
                break;
            case 'encoding done':
                message = "Encoding complete, ready to upload.";
                canUpload = true;
                break;
            case 'upload preparing':
                message = "Preparing to upload…";
                busy = true;
                break;
            case 'upload events pending':
                message = "Uploading events…";
                busy = true;
                break;
            case 'upload events done':
                message = "Uploading events… done.";
                break;
            case 'upload audio pending':
                message = "Uploading audio…";
                busy = true;
                break;
            case 'upload audio done':
                message = "Uploading audio done.";
                break;
            case 'done':
                message = "Save complete.";
                break;
            case 'error':
                message = (
                    <div>
                        <p>{"An error has occured."}</p>
                        <pre>{error.stack}</pre>
                    </div>
                );
                canUpload = true; // allow retry
                break;
        }

        /* TODO: select target among user grants */
        return (
            <form>
                <FormGroup labelFor='eventsUrlInput' label={"URL évènements"}>
                    <input id='eventsUrlInput' type='text' className='bp3-input bp3-fill' value={eventsUrl || ''}
                           readOnly/>
                </FormGroup>
                <FormGroup labelFor='audioUrlInput' label={"URL audio"}>
                    <input id='audioUrlInput' type='text' className='bp3-input bp3-fill' value={audioUrl || ''}
                           readOnly/>
                </FormGroup>
                {wavAudioUrl &&
                <FormGroup labelFor='wavAudioUrlInput' label={"URL audio (wav)"}>
                    <input id='wavAudioUrlInput' type='text' className='bp3-input bp3-fill' value={wavAudioUrl || ''}
                           readOnly/>
                </FormGroup>}
                <FormGroup label="Target">
                    <HTMLSelect options={grantOptions} value={targetUrl} onChange={this.handleTargetChange}/>
                </FormGroup>
                <Button onClick={this.onUpload} disabled={!canUpload} intent={canUpload ? Intent.PRIMARY : Intent.NONE}
                        icon='floppy-disk' text="Save"/>
                <div>
                    {busy
                        ? <Spinner size={Spinner.SIZE_SMALL}/>
                        : (step === 'done'
                            ? <Icon icon='tick' intent={Intent.SUCCESS}/>
                            : false)}
                    {message}
                </div>
                {typeof progress === 'number' &&
                <ProgressBar value={progress}/>}
                {playerUrl &&
                <FormGroup labelFor='playerUrlInput' label={getMessage('PLAYBACK_LINK')}>
                    <input id='playerUrlInput' type='text' className='bp3-input bp3-fill' value={playerUrl} readOnly/>
                </FormGroup>}
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

    onUpload = () => {
        const {targetUrl} = this.state;
        const grant = this.props.grants.find(grant => grant.url === targetUrl);
        if (grant) {
            this.props.dispatch({type: this.props.actionTypes.saveScreenUpload, payload: {target: grant}});
        }
    };
}
