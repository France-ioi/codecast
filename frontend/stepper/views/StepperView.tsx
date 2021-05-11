import React from "react";
import {Button, Icon} from "@blueprintjs/core";
import {PythonStackView} from "../python/analysis/components/PythonStackView";
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
import {getPlayerState} from "../../player/selectors";

interface StepperViewStateToProps {
    diagnostics: any,
    readOnly: boolean,
    sourceMode: string,
    sourceRowHeight: number,
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
    const getMessage = state.getMessage;
    const geometry = state.mainViewGeometry;
    const panes = state.panes;
    const diagnostics = state.compile.diagnosticsHtml;
    const currentStepperState = state.stepper.currentStepperState;
    const error = currentStepperState && currentStepperState.error;
    const readOnly = currentStepperState || props.preventInput;
    const {showIO, showViews, showStack, platform} = state.options;
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
    const preventInput = player.isPlaying;
    const windowHeight = state.windowHeight;

    return {
        diagnostics, readOnly, error, getMessage, geometry, panes, preventInput, sourceRowHeight,
        sourceMode, showStack, arduinoEnabled, showViews, showIO, windowHeight,
        currentStepperState,
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
            preventInput, error, getMessage, geometry, panes,
            windowHeight, currentStepperState,
            showStack, arduinoEnabled, showViews, showIO
        } = this.props;
        const height = `${windowHeight - this.state.top - 10}px`;

        const sourcePanelHeader = (
            <span>
                {getMessage('SOURCE')}
                {currentStepperState && <span>{' '}<Icon icon='lock'/></span>}
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
                                    <div className='card'>
                                        <div className='card-header'>
                                            <span>{getMessage('VARIABLES')}</span>
                                        </div>
                                        <div className='card-body'>
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
                                <div className='card'>
                                    <div className='card-header'>
                                        {sourcePanelHeader}
                                    </div>
                                    <div className='card-body'>
                                        <BufferEditor
                                            buffer='source'
                                            readOnly={readOnly}
                                            shield={preventInput}
                                            mode={sourceMode}
                                            theme={'textmate'}
                                            requiredWidth='100%'
                                            requiredHeight={sourceRowHeight}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {diagnostics &&
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className='card bg-danger'>
                                        <div className='card-header'>
                                            {diagnosticsPanelHeader}
                                        </div>
                                        <div className='card-body'>
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
                                    <div className='card bg-danger'>
                                        <div className='card-header'>
                                            {stepperErrorPanelHeader}
                                        </div>
                                        <div className='card-body'>
                                            <pre>{error}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                        {arduinoEnabled &&
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className='card'>
                                        <div className='card-header'>
                                            <span>
                                              {/* microchip icon */}
                                                {"Arduino"}
                                                {currentStepperState && <span>{' '}<Icon icon='lock'/></span>}
                                            </span>
                                        </div>
                                        <div className='card-body'>
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
