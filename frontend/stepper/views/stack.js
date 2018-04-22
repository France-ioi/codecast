
import React from 'react';
import classnames from 'classnames';
import {Alert, Button, ButtonGroup, Intent} from '@blueprintjs/core';
import Immutable from 'immutable';

import {viewFrame, renderValue, VarDecl, FunctionCall} from './utils';

export default function (bundle, deps) {

  bundle.use('stepperExit', 'stepperStackUp', 'stepperStackDown', 'getStepperDisplay');

  bundle.defer(function ({stepperApi}) {
    stepperApi.onInit(function (state) {
      state.controls = Immutable.Map({
        stack: Immutable.Map({focusDepth: 0})
      });
    });
  });

  bundle.defineSelector('StackViewSelector', function (state, props) {
    const getMessage = state.get('getMessage');
    const stepperState = deps.getStepperDisplay(state);
    if (!stepperState) {
      return {getMessage};
    }
    const {core, oldCore, analysis, controls} = stepperState;
    const {maxVisible} = props;
    const stackControls = controls.get('stack');
    const focusDepth = stackControls ? stackControls.get('focusDepth', 0) : 0;
    const firstVisible = Math.max(0, focusDepth - 5);
    return {
      getMessage,
      focusDepth,
      context: {core, oldCore},
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
      const {core} = context;
      if (core.error) {
        return (
          <div className="stack-view" style={{height}}>
            <Alert intent={Intent.DANGER} onClose={this.onExit}>
              <h4>{getMessage('ERROR')}</h4>
              <p>{core.error.toString()}</p>
            </Alert>
          </div>
        );
      }
      const {controls, analysis, focusDepth, firstVisible, firstExpanded, maxVisible, maxExpanded} = this.props;
      let {frames} = analysis;
      /* Hide frames that have no position in user code. */
      frames = frames.filter(function (frame) {
        if (!frame.get('func').body[1].range) {
          return false;
        }
        return true;
      });
      /* Display the frames in reverse order (top of the stack last). */
      frames = frames.reverse();
      const beyondVisible = Math.min(frames.size, firstVisible + maxVisible);
      const tailCount = frames.size - beyondVisible;
      const views = frames.slice(firstVisible, beyondVisible).map(function (frame, depth) {
        const focus = depth >= firstExpanded && depth < firstExpanded + maxExpanded;
        const view = viewFrame(context, frame, {locals: focus});
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
            </div>}
          {views.map(view => <FunctionFrame key={view.key} view={view} />)}
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

function FunctionFrame ({view}) {
  const {func, args, locals} = view;
  return (
    <div className={classnames(['stack-frame', view.focus && 'stack-frame-focused'])}>
      <FrameHeader func={func} args={args} />
      {locals && <FrameLocals locals={locals} />}
    </div>
  );
}

function FrameHeader ({func, args}) {
  return (
    <div className={classnames(["scope-function-title", false && "scope-function-top"])}>
      <FunctionCall func={func} args={args}/>
    </div>
  );
}

function FrameLocals ({locals}) {
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
  const argCount = args.length;
  return (
    <div className="scope-function-return">
      <FunctionCall func={func} args={args}/>
      {' '}
      <i className="fa fa-long-arrow-right"/>
      <span className="scope-function-retval">
        {renderValue(result)}
      </span>
    </div>
  );
}
