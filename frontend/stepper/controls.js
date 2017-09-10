
import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import * as C from 'persistent-c';

export default function (bundle, deps) {

  bundle.use(
    'getStepperState',
    'getStepperOptions',
    'stepperStep',
    'stepperInterrupt',
    'stepperRestart',
    'stepperExit',
    'stepperUndo',
    'stepperRedo',
    'translate',
    'isStepperInterrupting'
  );

  function StepperControlsSelector (state, props) {
    const {enabled} = props;
    const getMessage = state.get('getMessage');
    const options = deps.getStepperOptions(state);
    let showTranslate, showControls, showExit;
    let canTranslate, canExit, canRestart, canStep, canStepOut, canInterrupt, canUndo, canRedo;
    const stepper = deps.getStepperState(state);
    if (stepper) {
      const status = stepper.get('status');
      if (status === 'clear') {
        showTranslate = true;
        canTranslate = enabled;
      } else if (status === 'idle') {
        showExit = true;
        showControls = true;
        canExit = enabled;
        const current = stepper.get('current', {});
        if (current && current.core) {
          const {control, scope} = current.core;
          canStepOut = !!C.findClosestFunctionScope(scope);
          canStep = control && !!control.node;
          canRestart = enabled;
          canUndo = enabled && !stepper.get('undo').isEmpty();
          canRedo = enabled && !stepper.get('redo').isEmpty();
        }
      } else if (status === 'starting') {
        showExit = true;
        showControls = true;
      } else if (status === 'running') {
        showExit = true;
        showControls = true;
        canInterrupt = enabled && !deps.isStepperInterrupting(state);
      }
    }
    const result = {
      getMessage,
      showControls,
      showExit, canExit,
      showTranslate, canTranslate,
      canRestart, canStep, canStepOut, canInterrupt,
      canUndo, canRedo, options
    };
    return result;
  }

  bundle.defineView('StepperControls', StepperControlsSelector, EpicComponent(self => {

    const onStepRun = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'run'});
    };

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

    const onUndo = function () {
      self.props.dispatch({type: deps.stepperUndo});
    };

    const onRedo = function () {
      self.props.dispatch({type: deps.stepperRedo});
    };

    const onTranslate = function () {
      self.props.dispatch({type: deps.translate});
    };

    const btnStyle = function (which) {
      return self.props.options.get(which) === '+' ? 'primary' : 'default';
    };

    const btnDisabled = function (which) {
      const p = self.props;
      if (p.options && p.options.get(which) === '-') {
        return true;
      }
      switch (which) {
        case 'interrupt':
          return !p.canInterrupt;
        case 'restart':
          return !p.canRestart;
        case 'undo':
          return !p.canUndo;
        case 'redo':
          return !p.canRedo;
        case 'run': case 'expr': case 'into': case 'over':
          return !p.canStep;
        case 'out':
          return !(p.canStep && p.canStepOut);
      }
      return false;
    };

    const controlsWidth = `${36*9+16}px`;
    self.render = function () {
      const p = self.props;
      const showStepper = p.options && p.options.get('showStepper');
      if (!showStepper)
        return false;
      const {getMessage} = self.props;
      return (
        <div className="controls controls-stepper">
          {p.showControls && <ButtonGroup className="controls-stepper-execution" style={{width: controlsWidth}}>
            <Button onClick={onStepRun} disabled={btnDisabled('run')} bsStyle={btnStyle('run')} title={getMessage('CONTROL_RUN')}>
              <i className="fa fa-play"/>
            </Button>
            <Button onClick={onStepExpr} disabled={btnDisabled('expr')} bsStyle={btnStyle('expr')} title={getMessage('CONTROL_EXPR')}>
              <i className="fi fi-step-expr"/>
            </Button>
            <Button onClick={onStepInto} disabled={btnDisabled('into')} bsStyle={btnStyle('into')} title={getMessage('CONTROL_INTO')}>
              <i className="fi fi-step-into"/>
            </Button>
            <Button onClick={onStepOut} disabled={btnDisabled('out')} bsStyle={btnStyle('out')} title={getMessage('CONTROL_OUT')}>
              <i className="fi fi-step-out"/>
            </Button>
            <Button onClick={onStepOver} disabled={btnDisabled('over')} bsStyle={btnStyle('over')} title={getMessage('CONTROL_OVER')}>
              <i className="fi fi-step-over"/>
            </Button>
            <Button onClick={onInterrupt} disabled={btnDisabled('interrupt')} bsStyle={btnStyle('interrupt')} title={getMessage('CONTROL_INTERRUPT')}>
              <i className="fi fi-interrupt"/>
            </Button>
            <Button onClick={onRestart} disabled={btnDisabled('restart')} bsStyle={btnStyle('restart')} title={getMessage('CONTROL_RESTART')}>
              <i className="fi fi-restart"/>
            </Button>
            <Button onClick={onUndo} disabled={btnDisabled('undo')} bsStyle={btnStyle('undo')} title={getMessage('CONTROL_UNDO')}>
              <i className="fa fa-rotate-left"/>
            </Button>
            <Button onClick={onRedo} disabled={btnDisabled('redo')} bsStyle={btnStyle('redo')} title={getMessage('CONTROL_REDO')}>
              <i className="fa fa-rotate-right"/>
            </Button>
          </ButtonGroup>}
          {p.showControls || <div className="controls-stepper-execution">
            <p>{getMessage('EDITING')}</p>
          </div>}
          <div className="controls-translate">
            {p.showExit && <Button onClick={onEdit} disabled={!p.canExit}>{getMessage('EDIT')}</Button>}
            {p.showTranslate && <Button onClick={onTranslate} disabled={!p.canTranslate} bsStyle='primary'>{getMessage('COMPILE')}</Button>}
          </div>
        </div>
      );
    };

  }));

};
