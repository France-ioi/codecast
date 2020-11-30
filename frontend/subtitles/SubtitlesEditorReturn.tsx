import React from "react";
import {Button} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";

interface SubtitlesEditorReturnProps {
    dispatch: Function
}

export class SubtitlesEditorReturn extends React.PureComponent<SubtitlesEditorReturnProps> {
    render() {
        return <Button onClick={this._return} icon='direction-left' text='Back'/>;
    }

    _return = () => {
        this.props.dispatch({type: ActionTypes.SubtitlesEditorReturn});
    };
}
