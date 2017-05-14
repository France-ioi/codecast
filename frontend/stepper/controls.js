
import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';
import EpicComponent from 'epic-component';

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
    'translate'
  );

  function StepperControlsSelector (state, props) {
    const {enabled} = props;
    const options = deps.getStepperOptions(state);
    let showTranslate, showControls, showExit;
    let canTranslate, canExit, canRestart, canStep, canInterrupt, canUndo, canRedo;
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
          const {control} = current.core;
          canStep = !!control.node;
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
        canInterrupt = enabled;
      }
    }
    return {
      showControls,
      showExit, canExit,
      showTranslate, canTranslate,
      canRestart, canStep, canInterrupt,
      canUndo, canRedo, options
    };
  }

  bundle.defineView('StepperControls', StepperControlsSelector, EpicComponent(self => {

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
      const {options} = self.props;
      if (options && options.get(which) === '-') {
        return true;
      }
      switch (which) {
        case 'interrupt':
          return !self.props.canInterrupt;
        case 'restart':
          return !self.props.canRestart;
        case 'undo':
          return !self.props.canUndo;
        case 'redo':
          return !self.props.canRedo;
        case 'expr': case 'into': case 'out': case 'over':
          return !self.props.canStep;
      }
      return false;
    };

    self.render = function () {
      const p = self.props;
      const showStepper = p.options.get('showStepper');
      if (!showStepper)
        return false;
      return (
        <div className="controls controls-stepper">
          {p.showControls && <ButtonGroup className="controls-stepper-execution">
            <Button onClick={onStepExpr} disabled={btnDisabled('expr')} bsStyle={btnStyle('expr')} title="next expression">
              <i className="fi fi-step-expr"/>
            </Button>
            <Button onClick={onStepInto} disabled={btnDisabled('into')} bsStyle={btnStyle('into')} title="step into">
              <i className="fi fi-step-into"/>
            </Button>
            <Button onClick={onStepOut} disabled={btnDisabled('out')} bsStyle={btnStyle('out')} title="step out">
              <i className="fi fi-step-out"/>
            </Button>
            <Button onClick={onStepOver} disabled={btnDisabled('over')} bsStyle={btnStyle('over')} title="step over">
              <i className="fi fi-step-over"/>
            </Button>
            <Button onClick={onInterrupt} disabled={btnDisabled('interrupt')} bsStyle={btnStyle('interrupt')} title="interrupt">
              <i className="fi fi-interrupt"/>
            </Button>
            <Button onClick={onRestart} disabled={btnDisabled('restart')} bsStyle={btnStyle('restart')} title="restart">
              <i className="fi fi-restart"/>
            </Button>
            <Button onClick={onUndo} disabled={btnDisabled('undo')} bsStyle={btnStyle('undo')} title="undo">
              <i className="fa fa-rotate-left"/>
            </Button>
            <Button onClick={onRedo} disabled={btnDisabled('redo')} bsStyle={btnStyle('redo')} title="redo">
              <i className="fa fa-rotate-right"/>
            </Button>
          </ButtonGroup>}
          {p.showControls || <div className="controls-stepper-execution">
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
