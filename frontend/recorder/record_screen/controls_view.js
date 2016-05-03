
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

export default actions => EpicComponent(self => {

  const onPauseRecording = function () {
    // TODO
  };

  const onStopRecording = function () {
    self.props.dispatch({type: actions.recorderStop});
  };

  const onStepExpr = function () {
    self.props.dispatch({type: actions.stepperStep, mode: 'expr'});
  };

  const onStepInto = function () {
    self.props.dispatch({type: actions.stepperStep, mode: 'into'});
  };

  const onStepOut = function () {
    self.props.dispatch({type: actions.stepperStep, mode: 'out'});
  };

  const onRestart = function () {
    self.props.dispatch({type: actions.stepperRestart});
  };

  const onEdit = function () {
    self.props.dispatch({type: actions.stepperExit});
  };

  self.render = function () {
    const {isRecording, isStepping, haveNode, elapsed, eventCount, onTranslate} = self.props;
    return (
      <div className="pane pane-controls">
        <p>
          {false && <Button onClick={onPauseRecording} disabled={!isRecording}>
            <i className="fa fa-pause"/>
          </Button>}
          <Button onClick={onStopRecording} disabled={!isRecording}>
            <i className="fa fa-stop"/>
          </Button>
          {isStepping && <Button onClick={onStepExpr} disabled={!haveNode}>step expr</Button>}
          {isStepping && <Button onClick={onStepInto} disabled={!haveNode}>step into</Button>}
          {isStepping && <Button onClick={onStepOut} disabled={true||!haveNode}>step out</Button>}
          {isStepping && <Button onClick={onRestart}>recommencer</Button>}
          {isStepping && <Button onClick={onEdit}>éditer</Button>}
          {isStepping || <Button bsStyle='primary' onClick={onTranslate}>compiler</Button>}
          {' '}
          <span><i className="fa fa-clock-o"/> {Math.round(elapsed / 1000)||0}s</span>
          {' '}
          <span><i className="fa fa-bolt"/> {eventCount}</span>
        </p>
      </div>
    );
  };

});
