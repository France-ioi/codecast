import React from "react";
import {Button} from "@blueprintjs/core";

class TrimEditorReturn extends React.PureComponent {
    render() {
        return <Button onClick={this._return} icon='direction-left' text='Back'/>;
    }

    _return = () => {
        this.props.dispatch({type: this.props.return});
    };
}
