
import React from 'react';
import {Button} from '@blueprintjs/core';
import classnames from 'classnames';

class MainView extends React.PureComponent {
  render () {
    const {
      diagnostics, readOnly, sourceMode, sourceRowHeight,
      preventInput, haveStepper, error, options, getMessage, geometry, panes,
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
              <Panel bsStyle='danger'>
                <Panel.Heading>
                  {diagnosticsPanelHeader}
                </Panel.Heading>
                <Panel.Body>
                  <div className='diagnostics' style={{whiteSpace: 'pre', fontSize: '16px', padding: '5px'}}
                    dangerouslySetInnerHTML={diagnostics}/>
                </Panel.Body>
              </Panel>
            </div>
          </div>}
          {error && <div className="row">
            <div className="col-sm-12">
              <Panel bsStyle='danger'>
                <Panel.Heading>
                  {stepperErrorPanelHeader}
                </Panel.Heading>
                <Panel.Body>
                  <pre>{error}</pre>
                </Panel.Body>
              </Panel>
            </div>
          </div>}
          {ArduinoPanel && <div className="row">
            <div className="col-sm-12">
              <Panel>
                <Panel.Heading>
                  <span>
                    <i className="fa fa-microchip"/>
                    {" Arduino"}
                    {haveStepper && <span>{' '}<i className="fa fa-lock"/></span>}
                  </span>
                </Panel.Heading>
                <Panel.Body>
                  <ArduinoPanel preventInput={preventInput}/>
                </Panel.Body>
              </Panel>
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

export default function (bundle, deps) {

  bundle.use(
    'getTranslateDiagnostics', 'getStepperDisplay', 'getStepperOptions',
    'translateClearDiagnostics', 'stepperExit',
    'BufferEditor', 'StackView', 'DirectivesPane', 'IOPane',
    'ArduinoConfigPanel', 'ArduinoPanel'
  );

  function MainViewSelector (state, props) {
    const getMessage = state.get('getMessage');
    const geometry = state.get('mainViewGeometry');
    const panes = state.get('panes');
    const diagnostics = deps.getTranslateDiagnostics(state);
    const stepperDisplay = deps.getStepperDisplay(state);
    const haveStepper = !!stepperDisplay;
    const error = haveStepper && stepperDisplay.error;
    const readOnly = haveStepper || props.preventInput;
    const options = deps.getStepperOptions(state);
    const {translateClearDiagnostics, stepperExit} = deps;
    const arduinoEnabled = options.get('arduino');
    const sourceRowHeight = '300px';
    const sourceMode = arduinoEnabled ? 'arduino' : 'c_cpp';
    return {
      diagnostics, haveStepper, readOnly, error, options, getMessage, geometry, panes,
      translateClearDiagnostics, stepperExit,
      BufferEditor: deps.BufferEditor, sourceRowHeight, sourceMode,
      StackView: options.get('showStack') && deps.StackView,
      ArduinoPanel: arduinoEnabled && deps.ArduinoPanel,
      DirectivesPane: options.get('showViews') && deps.DirectivesPane,
      IOPane: options.get('showIO') && deps.IOPane
    };
  }

  bundle.defineView('MainView', MainViewSelector, MainView);

};
