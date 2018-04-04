
import React from 'react';
import {Button, ButtonGroup} from 'react-bootstrap';
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

  const controlsWidth = `${36*9+16}px`;

  class StepperControls extends React.PureComponent {

    render () {
      const p = this.props;
      const showStepper = p.options && p.options.get('showStepper');
      if (!showStepper)
        return false;
      const {getMessage} = this.props;
      return (
        <div className="controls controls-stepper">
          <div className="controls-stepper-wrapper">
            {p.showControls && <ButtonGroup className="controls-stepper-execution">
              {this._button('run', this.onStepRun, getMessage('CONTROL_RUN'), <i className="fi fi-run"/>)}
              {this._button('expr', this.onStepExpr, getMessage('CONTROL_EXPR'), <i className="fi fi-step-expr"/>)}
              {this._button('into', this.onStepInto, getMessage('CONTROL_INTO'), <i className="fi fi-step-into"/>)}
              {this._button('out', this.onStepOut, getMessage('CONTROL_OUT'), <i className="fi fi-step-out"/>)}
              {this._button('over', this.onStepOver, getMessage('CONTROL_OVER'), <i className="fi fi-step-over"/>)}
              {this._button('interrupt', this.onInterrupt, getMessage('CONTROL_INTERRUPT'), <i className="fi fi-interrupt"/>)}
              {this._button('restart', this.onRestart, getMessage('CONTROL_RESTART'), <i className="fi fi-restart"/>)}
              {this._button('undo', this.onUndo, getMessage('CONTROL_UNDO'), <i className="fa fa-rotate-left"/>)}
              {this._button('redo', this.onRedo, getMessage('CONTROL_REDO'), <i className="fa fa-rotate-right"/>)}
            </ButtonGroup>}
          </div>
          <div className="controls-translate">
            {p.showExit && this._button('edit', this.onEdit, false, getMessage('EDIT'))}
            {p.showTranslate && this._button('translate', this.onTranslate, false, getMessage('COMPILE'))}
          </div>
        </div>
      );
    };

    _button (key, onClick, title, body) {
      const {options} = this.props;
      let btnStyle = 'default', disabled = false;
      if (key === 'translate') {
        btnStyle = 'primary';
      }
      switch (key) {
        case 'interrupt':
          disabled = !this.props.canInterrupt;
          break;
        case 'restart':
          disabled = !this.props.canRestart;
          break;
        case 'undo':
          disabled = !this.props.canUndo;
          break;
        case 'redo':
          disabled = !this.props.canRedo;
          break;
        case 'run': case 'expr': case 'into': case 'over':
          disabled = !this.props.canStep;
          break;
        case 'out':
          disabled = !(this.props.canStep && this.props.canStepOut);
          break;
        case 'edit':
          disabled = !this.props.canExit;
          break;
        case 'translate':
          disabled = !this.props.canTranslate;
          break;
      }
      if (options) {
        const mod = options.get(key);
        if (mod === '_') {
          return false;
        }
        if (mod === '-') {
          disabled = true;
        }
        btnStyle = mod === '+' ? 'primary' : 'default';
      }
      if (title === false) {
        title = undefined;
      }
      return (
        <Button onClick={onClick} disabled={disabled} bsStyle={btnStyle} title={title}>{body}</Button>
      );
    }

    onStepRun = () => this.props.dispatch({type: deps.stepperStep, mode: 'run'});
    onStepExpr = () => this.props.dispatch({type: deps.stepperStep, mode: 'expr'});
    onStepInto = () => this.props.dispatch({type: deps.stepperStep, mode: 'into'});
    onStepOut = () => this.props.dispatch({type: deps.stepperStep, mode: 'out'});
    onStepOver = () => this.props.dispatch({type: deps.stepperStep, mode: 'over'});
    onInterrupt = () => this.props.dispatch({type: deps.stepperInterrupt});
    onRestart = () => this.props.dispatch({type: deps.stepperRestart});
    onEdit = () => this.props.dispatch({type: deps.stepperExit});
    onUndo = () => this.props.dispatch({type: deps.stepperUndo});
    onRedo = () => this.props.dispatch({type: deps.stepperRedo});
    onTranslate = () => this.props.dispatch({type: deps.translate});

  }
  bundle.defineView('StepperControls', StepperControlsSelector, StepperControls);

};
