
import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';
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
    const haveContext = status !== 'clear';
    const showExit = haveContext;
    const canExit = enabled && haveContext;
    const showTranslate = !haveContext;
    const canTranslate = enabled && !haveContext;
    const isStepping = haveContext && status !== 'idle';
    const current = stepper && stepper.get('current');
    const {control} = current || {};
    const haveNode = control && control.node;
    const canRestart = canExit && !isStepping;
    const canStep = enabled && !isStepping && haveNode;
    const canInterrupt = enabled && isStepping;
    return {
      haveContext,
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
        <div className="controls controls-stepper">
          {p.haveContext && <ButtonGroup className="controls-stepper-execution">
            <Button onClick={onStepExpr} disabled={!p.canStep} title="next expression">
              <i className="fi fi-step-expr"/>
            </Button>
            <Button onClick={onStepInto} disabled={!p.canStep} title="step into">
              <i className="fi fi-step-into"/>
            </Button>
            <Button onClick={onStepOut} disabled={!p.canStep} title="step out">
              <i className="fi fi-step-out"/>
            </Button>
            <Button onClick={onStepOver} disabled={!p.canStep} title="step over">
              <i className="fi fi-step-over"/>
            </Button>
            <Button onClick={onInterrupt} disabled={!p.canInterrupt} title="interrupt">
              <i className="fi fi-interrupt"/>
            </Button>
            <Button onClick={onRestart} disabled={!p.canRestart} title="restart">
              <i className="fi fi-restart"/>
            </Button>
          </ButtonGroup>}
          {p.haveContext || <div className="controls-stepper-execution">
            <p>Édition en cours</p>
          </div>}
          <div className="controls-translate">
            {p.showExit && <Button onClick={onEdit} disabled={!p.canExit}>éditer</Button>}
            {p.showTranslate && <Button onClick={onTranslate} disabled={!p.canTranslate} bsStyle='primary'>compiler</Button>}
          </div>
        </div>
      );
    };

  }));

};
