
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  yield use(
    'getStepperState',
    'stepperStep',
    'stepperInterrupt',
    'stepperRestart',
    'stepperExit',
    'translate'
  );

  yield defineSelector('StepperControlsSelector', function (state, props) {
    const {enabled} = props;
    const stepper = deps.getStepperState(state);
    const status = stepper && stepper.get('status');
    const isTranslated = status !== 'clear';
    const showExit = isTranslated;
    const canExit = enabled && isTranslated;
    const showTranslate = !isTranslated;
    const canTranslate = enabled && !isTranslated;
    const isStepping = isTranslated && status !== 'idle';
    const current = stepper && stepper.get('current');
    const {control} = current || {};
    const haveNode = control && control.node;
    const canRestart = enabled && !isStepping;
    const canStep = enabled && !isStepping && haveNode;
    const canInterrupt = enabled && isStepping;
    return {
      showExit, canExit,
      showTranslate, canTranslate,
      canRestart, canStep, canInterrupt
    };
  });

  yield defineView('StepperControls', 'StepperControlsSelector', EpicComponent(self => {

    const onStepExpr = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'expr'});
    };

    const onStepInto = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'into'});
    };

    const onStepOut = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'out'});
    };

    const onStepOver = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'over'});
    };

    const onInterrupt = function () {
      self.props.dispatch({type: deps.stepperInterrupt});
    };

    const onRestart = function () {
      self.props.dispatch({type: deps.stepperRestart});
    };

    const onEdit = function () {
      self.props.dispatch({type: deps.stepperExit});
    };

    const onTranslate = function () {
      self.props.dispatch({type: deps.translate});
    };

    self.render = function () {
      const p = self.props;
      return (
        <div>
          <Button onClick={onStepExpr} disabled={!p.canStep}>step expr</Button>
          <Button onClick={onStepInto} disabled={!p.canStep}>step into</Button>
          <Button onClick={onStepOut} disabled={!p.canStep}>step out</Button>
          <Button onClick={onStepOver} disabled={!p.canStep}>step over</Button>
          <Button onClick={onInterrupt} disabled={!p.canInterrupt}>interrompre</Button>
          <Button onClick={onRestart} disabled={!p.canRestart}>recommencer</Button>
          {p.showExit && <Button onClick={onEdit} disabled={!p.canExit}>éditer</Button>}
          {p.showTranslate && <Button onClick={onTranslate} disabled={!p.canTranslate} bsStyle='primary'>compiler</Button>}
        </div>
      );
    };

  }));

};
