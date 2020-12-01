import React from "react";
import {Button} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {connect, MapDispatchToPropsFactory} from "react-redux";
import {Dispatch} from "redux";

interface FullscreenButtonStateToProps {
    getMessage: Function,
    enabled: boolean,
    active: boolean
}

function mapStateToProps(state: AppStore): FullscreenButtonStateToProps {
    const fullscreen = state.get('fullscreen');

    return {
        enabled: fullscreen.get('enabled'),
        active: fullscreen.get('active'),
        getMessage: state.get('getMessage')
    }
}

interface FullscreenButtonDispatchToProps {
    dispatch: Function
}

interface FullscreenButtonProps extends FullscreenButtonStateToProps, FullscreenButtonDispatchToProps {

}

class _FullscreenButton extends React.PureComponent<FullscreenButtonProps> {
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

export const FullscreenButton = connect(mapStateToProps)(_FullscreenButton);
