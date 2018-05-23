
import React from 'react';
import {Button} from '@blueprintjs/core';
import classnames from 'classnames';

class MainView extends React.PureComponent {
  render () {
    const {
      diagnostics, readOnly, sourceMode, sourceRowHeight,
      preventInput, haveStepper, error, getMessage, geometry, panes,
      StackView, BufferEditor, ArduinoPanel, DirectivesPane, IOPane} = this.props;
    const sourcePanelHeader = (
      <span>
        {getMessage('SOURCE')}
        {haveStepper && <span>{' '}<i className="fa fa-lock"/></span>}
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
      <div id='mainView' className={classnames([`mainView-${geometry.size}`])}>
        <div style={{width: `${geometry.width}px`}}>
          <div className="row">
            {StackView && <div className="col-sm-3">
              <div className='panel panel-default'>
                <div className='panel-heading'>
                  <span>{getMessage('VARIABLES')}</span>
                </div>
                <div className='panel-body'>
                  {<StackView height={sourceRowHeight}/>}
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
                    mode={sourceMode} theme={'textmate'} width='100%' height={sourceRowHeight} globalName='source' />
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
                  <div className='diagnostics' style={{whiteSpace: 'pre', fontSize: '16px', padding: '5px'}}
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
                    <i className="fa fa-microchip"/>
                    {" Arduino"}
                    {haveStepper && <span>{' '}<i className="fa fa-lock"/></span>}
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
    );
  };
  _onClearDiagnostics = () => {
    this.props.dispatch({type: this.props.translateClearDiagnostics});
  };
  _onStepperExit = () => {
    this.props.dispatch({type: this.props.stepperExit});
  };
}

function MainViewSelector (state, props) {
  const {getPlayerState, getTranslateDiagnostics, getStepperDisplay, BufferEditor, StackView, ArduinoPanel, DirectivesPane, IOPane} = state.get('scope');
  const {translateClearDiagnostics, stepperExit} = state.get('actionTypes');
  const getMessage = state.get('getMessage');
  const geometry = state.get('mainViewGeometry');
  const panes = state.get('panes');
  const diagnostics = getTranslateDiagnostics(state);
  const stepperDisplay = getStepperDisplay(state);
  const haveStepper = !!stepperDisplay;
  const error = haveStepper && stepperDisplay.error;
  const readOnly = haveStepper || props.preventInput;
  const {showIO, showViews, showStack, mode} = state.get('options');
  const arduinoEnabled = mode === 'arduino';
  const sourceRowHeight = '300px';
  const sourceMode = arduinoEnabled ? 'arduino' : 'c_cpp';
  /* preventInput is set during playback (and seeking-while-paused) to prevent the
     user from messing up the editors, and to disable automatic scrolling of the
     editor triggered by some actions (specifically, highlighting).
  */
  const player = getPlayerState(state);
  const status = player.get('status');
  const preventInput = !/idle|ready|paused/.test(status) && !player.has('seekTo');
  return {
    diagnostics, haveStepper, readOnly, error, getMessage, geometry, panes, preventInput,
    translateClearDiagnostics, stepperExit,
    BufferEditor: BufferEditor, sourceRowHeight, sourceMode,
    StackView: showStack && StackView,
    ArduinoPanel: arduinoEnabled && ArduinoPanel,
    DirectivesPane: showViews && DirectivesPane,
    IOPane: showIO && IOPane
  };
}

export default function (bundle) {

  bundle.use(
    'getTranslateDiagnostics', 'getStepperDisplay',
    'translateClearDiagnostics', 'stepperExit',
    'BufferEditor', 'StackView', 'DirectivesPane', 'IOPane',
    'ArduinoConfigPanel', 'ArduinoPanel'
  );

  bundle.defineView('MainView', MainViewSelector, MainView);

};
