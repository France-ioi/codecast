import React from "react";
import {Button, Icon} from "@blueprintjs/core";
import PythonStackView from "../python/analysis/components/PythonStackView";
import classnames from 'classnames';
import {StepperViewPanes} from "./StepperViewPanes";
import {ActionTypes} from "../actionTypes";

interface StepperViewProps {
    diagnostics: any,
    readOnly: any,
    sourceMode: any,
    sourceRowHeight: any,
    preventInput: any,
    haveStepper: any,
    error: any,
    getMessage: any,
    geometry: any,
    panes: any,
    StackView: any,
    BufferEditor: any,
    ArduinoPanel: any,
    DirectivesPane: any,
    IOPane: any,
    windowHeight: any,
    currentStepperState: any,
    dispatch: Function
}

export class StepperView extends React.PureComponent<StepperViewProps> {
    state = {top: 79};
    _container: HTMLDivElement = null;

    render() {
        const {
            diagnostics, readOnly, sourceMode, sourceRowHeight,
            preventInput, haveStepper, error, getMessage, geometry, panes,
            StackView, BufferEditor, ArduinoPanel, DirectivesPane, IOPane,
            windowHeight,
            currentStepperState
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
                            {StackView && <div className="col-sm-3">
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
                            </div>}
                            <div className={StackView ? "col-sm-9" : "col-sm-12"}>
                                <div className='panel panel-default'>
                                    <div className='panel-heading'>
                                        {sourcePanelHeader}
                                    </div>
                                    <div className='panel-body'>
                                        <BufferEditor buffer='source' readOnly={readOnly} shield={preventInput}
                                                      mode={sourceMode} theme={'textmate'} width='100%'
                                                      height={sourceRowHeight} globalName='source'/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {diagnostics && <div className="row">
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
                        </div>}
                        {error && <div className="row">
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
                        </div>}
                        {ArduinoPanel && <div className="row">
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
                                        <ArduinoPanel preventInput={preventInput}/>
                                    </div>
                                </div>
                            </div>
                        </div>}
                        <div className="row">
                            <div className="col-sm-12">
                                {DirectivesPane && <DirectivesPane scale={geometry.svgScale}/>}
                                {IOPane && <IOPane preventInput={preventInput}/>}
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
