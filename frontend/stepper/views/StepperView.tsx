import React from "react";
import {Button, Icon} from "@blueprintjs/core";
import PythonStackView from "../python/analysis/components/PythonStackView";
import classnames from 'classnames';
import {StepperViewPanes} from "./StepperViewPanes";
import {ActionTypes} from "../actionTypes";
import {BufferEditor} from "../../buffers/BufferEditor";
import {ArduinoPanel} from "../arduino/ArduinoPanel";
import {IOPane} from "../io/IOPane";
import {StackView} from "./c/StackView";
import {DirectivesPane} from "./DirectivesPane";
import {connect} from "react-redux";
import {AppStore} from "../../store";

interface StepperViewStateToProps {
    diagnostics: any,
    readOnly: boolean,
    sourceMode: string,
    sourceRowHeight: number,
    haveStepper: boolean,
    error: string,
    getMessage: Function,
    geometry: any,
    panes: any,
    showStack: boolean,
    arduinoEnabled: boolean,
    showViews: boolean,
    showIO: boolean,
    windowHeight: any,
    currentStepperState: any,
    preventInput: any
}

function mapStateToProps(state: AppStore, props): StepperViewStateToProps {
    const {getPlayerState, getCompileDiagnostics, getCurrentStepperState} = state.get('scope');
    const getMessage = state.get('getMessage');
    const geometry = state.get('mainViewGeometry');
    const panes = state.get('panes');
    const diagnostics = getCompileDiagnostics(state);
    const stepperDisplay = getCurrentStepperState(state);
    const haveStepper = !!stepperDisplay;
    const error = haveStepper && stepperDisplay.error;
    const readOnly = haveStepper || props.preventInput;
    const {showIO, showViews, showStack, platform} = state.get('options');
    const arduinoEnabled = platform === 'arduino';

    /* TODO: make number of visible rows in source editor configurable. */
    const sourceRowHeight = Math.ceil(16 * 25); // 12*25 for /next

    let mode;
    switch (platform) {
        case 'arduino':
            mode = 'arduino';

            break;
        case 'python':
            mode = 'python';

            break;
        default:
            mode = 'c_cpp';

            break;
    }

    const sourceMode = mode;

    /* preventInput is set during playback to prevent the user from messing up
       the editors, and to disable automatic scrolling of the editor triggered
       by some actions (specifically, highlighting).
    */
    const player = getPlayerState(state);
    const preventInput = player.get('isPlaying');
    const windowHeight = state.get('windowHeight');

    return {
        diagnostics, haveStepper, readOnly, error, getMessage, geometry, panes, preventInput, sourceRowHeight,
        sourceMode, showStack, arduinoEnabled, showViews, showIO, windowHeight,
        currentStepperState: stepperDisplay,
    };
}

interface StepperViewDispatchToProps {
    dispatch: Function
}

interface StepperViewProps extends StepperViewStateToProps, StepperViewDispatchToProps {
    preventInput: any
}

class _StepperView extends React.PureComponent<StepperViewProps> {
    state = {top: 79};
    _container: HTMLDivElement = null;

    render() {
        const {
            diagnostics, readOnly, sourceMode, sourceRowHeight,
            preventInput, haveStepper, error, getMessage, geometry, panes,
            windowHeight, currentStepperState,
            showStack, arduinoEnabled, showViews, showIO
        } = this.props;
        const height = `${windowHeight - this.state.top - 10}px`;

        const sourcePanelHeader = (
            <span>
                {getMessage('SOURCE')}
                {haveStepper && <span>{' '}<Icon icon='lock'/></span>}
            </span>
        );
        const diagnosticsPanelHeader = (
            <div>
                <div className="pull-right">
                    <Button onClick={this._onClearDiagnostics} icon='cross'/>
                </div>
                <span>{getMessage('MESSAGES')}</span>
            </div>
        );
        const stepperErrorPanelHeader = (
            <div>
                <div className="pull-right">
                    <Button onClick={this._onStepperExit} icon='cross'/>
                </div>
                <span>{getMessage('ERROR')}</span>
            </div>
        );

        return (
            <div id='mainView-container' ref={this.refContainer}>
                <div id='mainView' className={classnames([`mainView-${geometry.size}`])} style={{height}}>
                    <div style={{width: `${geometry.width}px`}}>
                        <div className="row">
                            {showStack &&
                                <div className="col-sm-3">
                                    <div className='panel panel-default'>
                                        <div className='panel-heading'>
                                            <span>{getMessage('VARIABLES')}</span>
                                        </div>
                                        <div className='panel-body'>
                                            {(currentStepperState && currentStepperState.platform === 'python')
                                                ? <PythonStackView
                                                    height={sourceRowHeight}
                                                    analysis={currentStepperState.analysis}
                                                />
                                                : <StackView
                                                    height={sourceRowHeight}
                                                />
                                            }
                                        </div>
                                    </div>
                                </div>
                            }
                            <div className={showStack ? "col-sm-9" : "col-sm-12"}>
                                <div className='panel panel-default'>
                                    <div className='panel-heading'>
                                        {sourcePanelHeader}
                                    </div>
                                    <div className='panel-body'>
                                        <BufferEditor
                                            buffer='source'
                                            readOnly={readOnly}
                                            shield={preventInput}
                                            mode={sourceMode}
                                            theme={'textmate'}
                                            width='100%'
                                            height={sourceRowHeight}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {diagnostics &&
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className='panel panel-danger'>
                                        <div className='panel-heading'>
                                            {diagnosticsPanelHeader}
                                        </div>
                                        <div className='panel-body'>
                                            <div className='diagnostics'
                                                 style={{whiteSpace: 'pre', fontSize: '16px', padding: '5px'}}
                                                 dangerouslySetInnerHTML={diagnostics}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                        {error &&
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className='panel panel-danger'>
                                        <div className='panel-heading'>
                                            {stepperErrorPanelHeader}
                                        </div>
                                        <div className='panel-body'>
                                            <pre>{error}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                        {arduinoEnabled &&
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className='panel panel-default'>
                                        <div className='panel-heading'>
                                            <span>
                                              {/* microchip icon */}
                                                {"Arduino"}
                                                {haveStepper && <span>{' '}<Icon icon='lock'/></span>}
                                            </span>
                                        </div>
                                        <div className='panel-body'>
                                            <ArduinoPanel preventInput={preventInput} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                        <div className="row">
                            <div className="col-sm-12">
                                {showViews && <DirectivesPane scale={geometry.svgScale}/>}
                                {showIO && <IOPane preventInput={preventInput}/>}
                            </div>
                        </div>
                    </div>
                </div>
                <StepperViewPanes panes={panes}/>
            </div>
        );
    };

    componentDidUpdate(prevProps, prevState) {
        const top = this._container.offsetTop;
        if (top !== this.state.top) {
            this.setState({top});
        }
    }

    _onClearDiagnostics = () => {
        this.props.dispatch({type: ActionTypes.CompileClearDiagnostics});
    };

    _onStepperExit = () => {
        this.props.dispatch({type: ActionTypes.StepperExit});
    };

    refContainer = (element) => {
        this._container = element;
    };
}

export const StepperView = connect(mapStateToProps)(_StepperView);
