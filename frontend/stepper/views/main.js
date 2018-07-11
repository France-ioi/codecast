
import React from 'react';
import {Button} from '@blueprintjs/core';
import classnames from 'classnames';

class StepperView extends React.PureComponent {
  render () {
    const {
      diagnostics, readOnly, sourceMode, sourceRowHeight,
      preventInput, haveStepper, error, getMessage, geometry, panes,
      StackView, BufferEditor, ArduinoPanel, DirectivesPane, IOPane,
      windowHeight
    } = this.props;
    const height = `${windowHeight - this.state.top - 10}px`;
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
        <StepperViewPanes panes={panes}/>
      </div>
    );
  };
  componentDidUpdate (prevProps, prevState) {
    const top = this._container.offsetTop;
    if (top !== this.state.top) {
      this.setState({top});
    }
  }
  _onClearDiagnostics = () => {
    this.props.dispatch({type: this.props.translateClearDiagnostics});
  };
  _onStepperExit = () => {
    this.props.dispatch({type: this.props.stepperExit});
  };
  refContainer = (element) => {
    this._container = element;
  };
  state = {top: 79};
}

/* XXX move out of here? */
class StepperViewPanes extends React.PureComponent {
  render () {
    const {panes} = this.props;
    return (
      <div id='mainView-panes'>
        {panes.entrySeq().map(([key, pane]) => {
          if (!pane.get('visible')) return false;
          const View = pane.get('View');
          const paneStyle = {
            width: `${pane.get('width')}px`
          };
          return (
            <div key={key} className='pane' style={paneStyle}>
              <View />
            </div>
          );
        })}
      </div>
    );
  }
}

function StepperViewSelector (state, props) {
  const {getPlayerState, getTranslateDiagnostics, getStepperDisplay} = state.get('scope');
  const {BufferEditor, StackView, ArduinoPanel, DirectivesPane, IOPane} = state.get('views');
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
  /* TODO: make number of visible rows in source editor configurable. */
  const sourceRowHeight = `${Math.ceil(16 * 25)}px`; // 12*25 for /next
  const sourceMode = arduinoEnabled ? 'arduino' : 'c_cpp';
  /* preventInput is set during playback to prevent the user from messing up
     the editors, and to disable automatic scrolling of the editor triggered
     by some actions (specifically, highlighting).
  */
  const player = getPlayerState(state);
  const preventInput = player.get('isPlaying');
  const windowHeight = state.get('windowHeight');
  return {
    diagnostics, haveStepper, readOnly, error, getMessage, geometry, panes, preventInput,
    translateClearDiagnostics, stepperExit,
    BufferEditor: BufferEditor, sourceRowHeight, sourceMode,
    StackView: showStack && StackView,
    ArduinoPanel: arduinoEnabled && ArduinoPanel,
    DirectivesPane: showViews && DirectivesPane,
    IOPane: showIO && IOPane,
    windowHeight
  };
}

export default function (bundle) {
  bundle.defineView('StepperView', StepperViewSelector, StepperView);
};
