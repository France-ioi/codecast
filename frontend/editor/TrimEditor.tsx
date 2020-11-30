import React from "react";
import {AnchorButton, Button, FormGroup, HTMLSelect, Icon, Intent, ProgressBar, Spinner} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {ActionTypes} from "./actionTypes";

interface TrimEditorProps {
    saving: any,
    grants: any,
    dispatch: Function
}

export class TrimEditor extends React.PureComponent<TrimEditorProps> {
    state = {targetUrl: ''};

    static getDerivedStateFromProps(props, state) {
        /* Default to first valid grant. */
        if (!state.targetUrl && props.grants && props.grants.length > 0) {
            return {targetUrl: props.grants[0].url};
        }
        return null;
    }

    render() {
        const {saving, grants} = this.props;
        const {targetUrl} = this.state;
        const grantOptions = grants.map(({url, description}) => ({value: url, label: description}));
        let savingView = null;

        if (saving) {
            const stepRows = [];
            for (let step of savingSteps) {
                const status = saving[step.key];
                stepRows.push(<StepRow key={step.key} title={step.label} status={status}/>);
                if (status === 'pending') {
                    stepRows.push(
                        <div key={`${step.key}_progress`} style={{margin: '10px 0 20px 0'}}>
                            <ProgressBar value={saving.progress}/>
                        </div>
                    );
                }
            }
            savingView = (
                <div style={{marginTop: '10px'}}>
                    <h2>{"Saving"}</h2>
                    <div className="vbox">
                        {stepRows}
                    </div>
                    {saving.done &&
                    <div style={{textAlign: 'center'}}>
                        <AnchorButton href={saving.playerUrl} target='_blank' text="Open in player"/>
                    </div>}
                </div>
            );
        }
        return (
            <div>
                <Button onClick={this._beginEdit} icon={IconNames.EDIT} text={"Edit"}/>
                <FormGroup label="Target">
                    <HTMLSelect options={grantOptions} value={targetUrl} onChange={this.handleTargetChange}/>
                </FormGroup>
                <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"}/>
                {savingView}
            </div>
        );
    }

    handleTargetChange = (event) => {
        this.setState({targetUrl: event.target.value});
    };
    _beginEdit = () => {
        this.props.dispatch({type: ActionTypes.EditorTrimEnter});
    };
    _save = () => {
        const {targetUrl} = this.state;
        const grant = this.props.grants.find(grant => grant.url === targetUrl);
        if (grant) {
            this.props.dispatch({type: ActionTypes.EditorTrimSave, payload: {target: grant}});
        }
    };
}

const savingSteps = [
    {key: 'prepareUpload', label: "Preparing upload"},
    {key: 'uploadEvents', label: "Uploading events"},
    {key: 'assembleAudio', label: "Assembling audio stream"},
    {key: 'encodeAudio', label: "Encoding audio stream"},
    {key: 'uploadAudio', label: "Uploading audio"},
    {key: 'updateSubtitles', label: "Updating Subtitles"},
    {key: 'uploadSubtitles', label: "Uploading Subtitles"},
];

function StepRow({title, status}) {
    return (
        <ul style={{height: '28px', listStyle: 'none'}}>
            <li>
                <div style={{display: 'inline-block', width: '40px', textAlign: 'center'}}>
                    {status === 'done' && <Icon icon='tick' intent={Intent.SUCCESS}/>}
                    {status === 'error' && <Icon icon='cross' intent={Intent.DANGER}/>}
                    {status === 'pending' && <Spinner size={Spinner.SIZE_SMALL}/>}
                </div>
                <div style={status === 'pending' ? {
                    display: 'inline-block',
                    fontWeight: 'bold'
                } : {display: 'inline-block'}}>
                    {title}
                </div>
            </li>
        </ul>
    );
}
