import React from 'react';
import classnames from 'classnames';
import {Alert, Button, ButtonGroup, Icon, Intent} from '@blueprintjs/core';
import Immutable from 'immutable';

import {viewStackFrame, renderValue, VarDecl, FunctionCall} from './utils';

export default function (bundle, deps) {

  bundle.use('stepperExit', 'stepperStackUp', 'stepperStackDown', 'getCurrentStepperState');

  bundle.defer(function ({stepperApi}) {
    stepperApi.onInit(function (state) {
      state.controls = Immutable.Map({
        stack: Immutable.Map({focusDepth: 0})
      });
    });
  });

  bundle.defineSelector('StackViewSelector', function (state, props) {
    const getMessage = state.get('getMessage');
    const stepperState = deps.getCurrentStepperState(state);
    if (!stepperState) {
      return {getMessage};
    }
    const {programState, lastProgramState, analysis, controls} = stepperState;
    const stackControls = controls.get('stack');
    const focusDepth = stackControls ? stackControls.get('focusDepth', 0) : 0;
    const firstVisible = Math.max(0, focusDepth - 5);

    return {
      getMessage,
      focusDepth,
      context: {programState, lastProgramState},
      analysis,
      controls: stackControls,
      firstVisible,
      firstExpanded: focusDepth - firstVisible,
      maxExpanded: 1
    };
  });

  class StackView extends React.PureComponent {
    onExit = () => {
      this.props.dispatch({type: deps.stepperExit});
    };

    onStackUp = () => {
      this.props.dispatch({type: deps.stepperStackUp});
    };

    onStackDown = () => {
      this.props.dispatch({type: deps.stepperStackDown});
    };

    render () {
      const {context, height, getMessage} = this.props;
      if (!context) {
        return (
          <div className="stack-view" style={{height}}>
            <p>{getMessage('PROGRAM_STOPPED')}</p>
          </div>
        );
      }

      const {programState} = context;
      if (programState.error) {
        return (
          <div className="stack-view" style={{height}}>
            <Alert intent={Intent.DANGER} onClose={this.onExit}>
              <h4>{getMessage('ERROR')}</h4>
              <p>{programState.error.toString()}</p>
            </Alert>
          </div>
        );
      }

      const {analysis, firstVisible, firstExpanded, maxVisible, maxExpanded} = this.props;
      let {functionCallStack} = analysis;
      /* Hide function calls that have no position in user code. */
      functionCallStack = functionCallStack.filter(function (stackFrame) {
        if (!stackFrame.get('func').body[1].range) {
          return false;
        }

        return true;
      });

      /* Display the functionCallStack in reverse order (top of the stack last). */
      functionCallStack = functionCallStack.reverse();
      const beyondVisible = Math.min(functionCallStack.size, firstVisible + maxVisible);
      const tailCount = functionCallStack.size - beyondVisible;
      const views = functionCallStack.slice(firstVisible, beyondVisible).map(function (stackFrame, depth) {
        const focus = depth >= firstExpanded && depth < firstExpanded + maxExpanded;
        const view = viewStackFrame(context, stackFrame, {locals: focus});
        view.focus = focus;
        return view;
      });

      const {callReturn} = this.props.analysis;

      return (
        <div className="stack-view" style={{height}}>
          <div className="stack-controls">
            <ButtonGroup>
              <Button minimal small onClick={this.onStackUp} title="navigate up the stack" icon='arrow-up'/>
              <Button minimal small onClick={this.onStackDown} title="navigate down the stack" icon='arrow-down'/>
            </ButtonGroup>
          </div>
          {callReturn && <CallReturn view={callReturn} />}
          {firstVisible > 0 &&
            <div key='tail' className="scope-ellipsis">
              {'… +'}{firstVisible}
            </div>
          }
          {views.map(view => <FunctionStackFrame key={view.key} view={view} />)}
          {tailCount > 0 &&
            <div key='tail' className="scope-ellipsis">
              {'… +'}{tailCount}
            </div>}
          <div className="stack-bottom" />
        </div>
      );
    };
  }

  StackView.defaultProps = {
    height: '100%',
    firstVisible: 0,
    maxVisible: 10,
    firstExpanded: 0,
    maxExpanded: 1
  };

  bundle.defineView('StackView', 'StackViewSelector', StackView);
};

function FunctionStackFrame ({view}) {
  const {func, args, locals} = view;
  return (
    <div className={classnames(['stack-frame', view.focus && 'stack-frame-focused'])}>
      <StackFrameHeader func={func} args={args} />
      {locals && <StackFrameLocals locals={locals} />}
    </div>
  );
}

function StackFrameHeader ({func, args}) {
  return (
    <div className={classnames(["scope-function-title"])}>
      <FunctionCall func={func} args={args}/>
    </div>
  );
}

function StackFrameLocals ({locals}) {
  return (
    <div className="scope-function-blocks">
      <ul>
        {locals.map(decl =>
          <li key={decl.name}><VarDecl {...decl}/></li>
        )}
      </ul>
    </div>
  );
}

function CallReturn ({view}) {
  const {func, args, result} = view;

  return (
    <div className="scope-function-return">
      <FunctionCall func={func} args={args}/>
      {' '}
      <Icon icon='arrow-right'/>
      <span className="scope-function-retval">
        {renderValue(result)}
      </span>
    </div>
  );
}
