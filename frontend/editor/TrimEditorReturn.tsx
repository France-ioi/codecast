import React from "react";
import {Button} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";

interface TrimEditorReturnDispatchToProps {
    dispatch: Function
}

interface TrimEditorReturnProps extends TrimEditorReturnDispatchToProps {

}

class _TrimEditorReturn extends React.PureComponent<TrimEditorReturnProps> {
    render() {
        return <Button onClick={this._return} icon='direction-left' text='Back'/>;
    }

    _return = () => {
        this.props.dispatch({type: ActionTypes.EditorTrimReturn});
    };
}

export const TrimEditorReturn = connect()(_TrimEditorReturn);
