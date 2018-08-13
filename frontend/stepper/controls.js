
import React from 'react';
import {Button, ButtonGroup, Intent} from '@blueprintjs/core';
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
    const {controls, showStepper} = state.get('options');
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
      showStepper, showControls, controls,
      showExit, canExit,
      showTranslate, canTranslate,
      canRestart, canStep, canStepOut, canInterrupt,
      canUndo, canRedo
    };
    return result;
  }

  const controlsWidth = `${36*9+16}px`;

  class StepperControls extends React.PureComponent {

    render () {
      const {showStepper} = this.props;
      if (!showStepper)
        return false;
      const {getMessage, showControls, showExit, showTranslate} = this.props;
      return (
        <div className="controls controls-stepper">
          <div className="controls-stepper-wrapper">
            {showControls && <ButtonGroup className="controls-stepper-execution">
              {this._button('run', this.onStepRun, getMessage('CONTROL_RUN'),               <i className="bp3-icon fi fi-run"/>)}
              {this._button('expr', this.onStepExpr, getMessage('CONTROL_EXPR'),            <i className="bp3-icon fi fi-step-expr"/>)}
              {this._button('into', this.onStepInto, getMessage('CONTROL_INTO'),            <i className="bp3-icon fi fi-step-into"/>)}
              {this._button('out', this.onStepOut, getMessage('CONTROL_OUT'),               <i className="bp3-icon fi fi-step-out"/>)}
              {this._button('over', this.onStepOver, getMessage('CONTROL_OVER'),            <i className="bp3-icon fi fi-step-over"/>)}
              {this._button('interrupt', this.onInterrupt, getMessage('CONTROL_INTERRUPT'), <i className="bp3-icon fi fi-interrupt"/>)}
              {this._button('restart', this.onRestart, getMessage('CONTROL_RESTART'),       <i className="bp3-icon fi fi-restart"/>)}
              {this._button('undo', this.onUndo, getMessage('CONTROL_UNDO'),                'undo')}
              {this._button('redo', this.onRedo, getMessage('CONTROL_REDO'),                'redo')}
            </ButtonGroup>}
          </div>
          <div className="controls-translate">
            {showExit && this._button('edit', this.onEdit, false, false, getMessage('EDIT'))}
            {showTranslate && this._button('translate', this.onTranslate, false, false, getMessage('COMPILE'))}
          </div>
        </div>
      );
    };

    _button (key, onClick, title, icon, text) {
      const {controls} = this.props;
      let intent = Intent.NONE, disabled = false;
      if (key === 'translate') {
        intent = Intent.PRIMARY;
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
      if (controls) {
        const mod = controls.key;
        if (mod === '_') {
          return false;
        }
        if (mod === '-') {
          disabled = true;
        }
        if (mod) {
          intent = mod === '+' ? Intent.PRIMARY : Intent.NONE;
        }
      }
      if (title === false) {
        title = undefined;
      }
      return (
        <Button onClick={onClick} disabled={disabled} intent={intent} title={title} icon={icon} text={text} />
      );
    }

    onStepRun = () => this.props.dispatch({type: deps.stepperStep, payload: {mode: 'run'}});
    onStepExpr = () => this.props.dispatch({type: deps.stepperStep, payload: {mode: 'expr'}});
    onStepInto = () => this.props.dispatch({type: deps.stepperStep, payload: {mode: 'into'}});
    onStepOut = () => this.props.dispatch({type: deps.stepperStep, payload: {mode: 'out'}});
    onStepOver = () => this.props.dispatch({type: deps.stepperStep, payload: {mode: 'over'}});
    onInterrupt = () => this.props.dispatch({type: deps.stepperInterrupt, payload: {}});
    onRestart = () => this.props.dispatch({type: deps.stepperRestart, payload: {}});
    onEdit = () => this.props.dispatch({type: deps.stepperExit, payload: {}});
    onUndo = () => this.props.dispatch({type: deps.stepperUndo, payload: {}});
    onRedo = () => this.props.dispatch({type: deps.stepperRedo, payload: {}});
    onTranslate = () => this.props.dispatch({type: deps.translate, payload: {}});

  }
  bundle.defineView('StepperControls', StepperControlsSelector, StepperControls);

};
