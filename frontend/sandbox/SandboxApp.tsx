import React from 'react';
import classnames from 'classnames';
import {StepperControls} from "../stepper/views/StepperControls";
import Menu from "../common/Menu";
import {StepperView} from "../stepper/views/StepperView";

interface SandboxAppProps {
    containerWidth: any,
    viewportTooSmall: any
}

export class SandboxApp extends React.PureComponent<SandboxAppProps> {
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
}
