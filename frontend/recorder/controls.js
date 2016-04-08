
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import actions from '../actions';
import {recordEventAction} from './utils';

export const RecordingControls = EpicComponent(self => {

  const onPauseRecording = function () {
    // TODO
  };

  const onStopRecording = function () {
    self.props.dispatch({type: actions.recorderStop});
  };

  const onStepExpr = function () {
    self.props.dispatch(recordEventAction(['stepExpr']));
    self.props.dispatch({type: actions.recordScreenStepperStep, mode: 'expr'});
  };

  const onStepInto = function () {
    self.props.dispatch(recordEventAction(['stepInto']));
    self.props.dispatch({type: actions.recordScreenStepperStep, mode: 'into'});
  };

  const onStepOut = function () {
    self.props.dispatch(recordEventAction(['stepOut']));
    self.props.dispatch({type: actions.recordScreenStepperStep, mode: 'out'});
  };

  const onRestart = function () {
    self.props.dispatch(recordEventAction(['stepperRestart']));
    self.props.dispatch({type: actions.recordScreenStepperRestart});
  };

  const onEdit = function () {
    self.props.dispatch(recordEventAction(['translateClear']));
    self.props.dispatch({type: actions.recordScreenStepperExit});
  };

  self.render = function () {
    const {isRecording, isTranslated, haveNode, elapsed, eventCount, onTranslate} = self.props;
    return (
      <div className="pane pane-controls">
        <p>
          {false && <Button onClick={onPauseRecording} disabled={!isRecording}>
            <i className="fa fa-pause"/>
          </Button>}
          <Button onClick={onStopRecording} disabled={!isRecording}>
            <i className="fa fa-stop"/>
          </Button>
          {isTranslated && <Button onClick={onStepExpr} disabled={!haveNode}>step expr</Button>}
          {isTranslated && <Button onClick={onStepInto} disabled={!haveNode}>step into</Button>}
          {isTranslated && <Button onClick={onStepOut} disabled={true||!haveNode}>step out</Button>}
          {isTranslated && <Button onClick={onRestart}>recommencer</Button>}
          {isTranslated && <Button onClick={onEdit}>éditer</Button>}
          {isTranslated || <Button bsStyle='primary' onClick={onTranslate}>compiler</Button>}
        </p>
        <p>Enregistrement : {Math.round(elapsed / 1000)}s, {eventCount} évènements</p>
      </div>
    );
  };

});

export default RecordingControls;
