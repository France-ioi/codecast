import React from "react";
import {Button} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";

interface SubtitlesEditorReturnDispatchToProps {
    dispatch: Function
}

interface SubtitlesEditorReturnProps extends SubtitlesEditorReturnDispatchToProps {

}

class _SubtitlesEditorReturn extends React.PureComponent<SubtitlesEditorReturnProps> {
    render() {
        return <Button onClick={this._return} icon='direction-left' text='Back'/>;
    }

    _return = () => {
        this.props.dispatch({type: ActionTypes.SubtitlesEditorReturn});
    };
}

export const SubtitlesEditorReturn = connect()(_SubtitlesEditorReturn);
