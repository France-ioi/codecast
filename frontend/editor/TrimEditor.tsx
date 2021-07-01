import React from "react";
import {AnchorButton, Button, FormGroup, HTMLSelect} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface TrimEditorStateToProps {
    saving: any,
    grants: any[]
}

function mapStateToProps(state: AppStore): TrimEditorStateToProps {
    const user = state.user;
    const grants = user ? user.grants : [];

    return {saving: {}, grants};
}

interface TrimEditorDispatchToProps {
    dispatch: Function
}

interface TrimEditorProps extends TrimEditorStateToProps, TrimEditorDispatchToProps {

}

class _TrimEditor extends React.PureComponent<TrimEditorProps> {
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
            savingView = (
                <div style={{marginTop: '10px'}}>
                    <h2>{"Saving"}</h2>
                    <div className="vbox">
                        {stepRows}
                    </div>
                    {saving.done &&
                        <div style={{textAlign: 'center'}}>
                            <AnchorButton href={saving.playerUrl} target='_blank' text="Open in player" rel="noreferrer"/>
                        </div>
                    }
                </div>
            );
        }
        return (
            <div>
                <Button onClick={this._beginEdit} icon={IconNames.EDIT} text={"Edit"} />
                <FormGroup label="Target">
                    <HTMLSelect options={grantOptions} value={targetUrl} onChange={this.handleTargetChange} />
                </FormGroup>
                <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"} />

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

export const TrimEditor = connect(mapStateToProps)(_TrimEditor);
