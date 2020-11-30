import React from "react";
import {Button} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";

interface FullscreenButtonProps {
    dispatch: Function,
    getMessage: Function,
    enabled: boolean,
    active: boolean
}

export class FullscreenButton extends React.PureComponent<FullscreenButtonProps> {
    render() {
        const {enabled, active, getMessage} = this.props;
        const tooltip = getMessage(active ? 'EXIT_FULLSCREEN' : 'FULLSCREEN');
        return (
            <Button onClick={active ? this._leaveFullscreen : this._enterFullscreen} disabled={!enabled} title={tooltip}
                    icon={active ? 'minimize' : 'fullscreen'}/>
        );
    }

    _enterFullscreen = () => {
        this.props.dispatch({type: ActionTypes.FullscreenEnter});
    };
    _leaveFullscreen = () => {
        this.props.dispatch({type: ActionTypes.FullscreenLeave});
    };
}
