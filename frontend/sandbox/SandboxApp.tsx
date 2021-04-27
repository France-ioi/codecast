import React from 'react';
import classnames from 'classnames';
import {StepperControls} from "../stepper/views/StepperControls";
import {StepperView} from "../stepper/views/StepperView";
import {Menu} from "../common/Menu";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {ActionTypes} from "../task/actionTypes";

interface SandboxAppStateToProps {
    containerWidth: number,
    viewportTooSmall: boolean
}

function mapStateToProps(state: AppStore): SandboxAppStateToProps {
    const containerWidth = state.containerWidth;
    const viewportTooSmall = state.viewportTooSmall;

    return {
        viewportTooSmall, containerWidth
    };
}

interface SandboxAppDispatchToProps {
    dispatch: Function
}

interface SandboxAppProps extends SandboxAppStateToProps, SandboxAppDispatchToProps {

}

class _SandboxApp extends React.PureComponent<SandboxAppProps> {
    render() {
        const {containerWidth, viewportTooSmall} = this.props;

        return (
            <div id='main' style={{width: `${containerWidth}px`}}
                 className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
                <div id='player-controls'>
                    <div className='player-controls-row row' style={{width: '100%'}}>
                        <div className="player-controls controls controls-main col-sm-3"></div>
                        <div className="player-controls player-controls-stepper col-sm-7">
                            <StepperControls enabled={true}/>
                        </div>
                        <div className="player-controls player-controls-right col-sm-2">
                            <Menu />
                        </div>
                    </div>
                </div>

                <StepperView />
            </div>
        );
    };

    componentDidMount() {
        this.props.dispatch({type: ActionTypes.TaskLoad});
    }
}

export const SandboxApp = connect(mapStateToProps)(_SandboxApp);
