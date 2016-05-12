
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
    const stepper = deps.getStepperState(state);
    const status = stepper && stepper.get('status');
    const isCompiled = status !== 'clear';
    const isStepping = isCompiled && status !== 'idle';
    const current = stepper && stepper.get('current');
    const {control} = current || {};
    const canStep = !!(!isStepping && control && control.node);
    return {isCompiled, isStepping, canStep};
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
      const {isCompiled, isStepping, canStep} = self.props;
      return (
        <div>
          <Button onClick={onStepExpr} disabled={!canStep}>step expr</Button>
          <Button onClick={onStepInto} disabled={!canStep}>step into</Button>
          <Button onClick={onStepOut} disabled={!canStep}>step out</Button>
          <Button onClick={onStepOver} disabled={!canStep}>step over</Button>
          <Button onClick={onInterrupt} disabled={!isStepping}>interrompre</Button>
          <Button onClick={onRestart} disabled={isStepping}>recommencer</Button>
          {isCompiled && <Button onClick={onEdit}>éditer</Button>}
          {isCompiled || <Button onClick={onTranslate} bsStyle='primary'>compiler</Button>}
        </div>
      );
    };

  }));

};
