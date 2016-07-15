
import React from 'react';
import classnames from 'classnames';
import {Alert, Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import Immutable from 'immutable';

import {use, defineSelector, defineView} from '../utils/linker';
import {viewFrame, renderValue, VarDecl, FunctionCall} from './utils';

export default function* (deps) {

  yield use('stepperExit', 'stepperStackUp', 'stepperStackDown', 'getStepperDisplay');

  yield defineSelector('StackViewSelector', function (state, props) {
    const stepperState = deps.getStepperDisplay(state);
    if (!stepperState) {
      return {};
    }
    const {core, analysis, controls} = stepperState;
    const {maxVisible} = props;
    const stackControls = controls.get('stack');
    const focusDepth = stackControls ? stackControls.get('focusDepth', 0) : 0;
    const firstVisible = Math.max(0, focusDepth - 5);
    return {
      focusDepth,
      core,
      analysis,
      controls: stackControls,
      firstVisible,
      firstExpanded: focusDepth - firstVisible,
      maxExpanded: 1
    };
  });

  const StackView = EpicComponent(self => {

    const renderFrameHeader = function (view) {
      const {func, args} = view;
      return (
        <div className={classnames(["scope-function-title", false && "scope-function-top"])}>
          <FunctionCall func={func} args={args}/>
        </div>
      );
    };

    const renderFrameLocals = function (decls) {
      return (
        <div className="scope-function-blocks">
          <ul>
          {decls.map(decl =>
            <li key={decl.name}><VarDecl {...decl}/></li>
          )}
          </ul>
        </div>
      );
    };

    const renderFrame = function (view) {
      // {key, func, args, locals}
      const {key, locals} = view;
      return (
        <div key={key} className={classnames(['stack-frame', view.focus && 'stack-frame-focused'])}>
          {renderFrameHeader(view)}
          {locals && renderFrameLocals(locals)}
        </div>
      );
    };

    const renderCallReturn = function () {
      const {callReturn} = self.props.analysis;
      if (!callReturn) {
        return false;
      }
      const {func, args, result} = callReturn;
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
    };

    const onExit = function () {
      self.props.dispatch({type: deps.stepperExit});
    };

    const onStackUp = function () {
      self.props.dispatch({type: deps.stepperStackUp});
    };

    const onStackDown = function () {
      self.props.dispatch({type: deps.stepperStackDown});
    };

    self.render = function () {
      const {core, height} = self.props;
      if (!core) {
        return (
          <div className="stack-view" style={{height}}>
            <p>Programme arrêté.</p>
          </div>
        );
      }
      if (core.error) {
        return (
          <div className="stack-view" style={{height}}>
            <Alert bsStyle="danger" onDismiss={onExit}>
              <h4>Erreur</h4>
              <p>{core.error.toString()}</p>
            </Alert>
          </div>
        );
      }
      const {controls, analysis, focusDepth, firstVisible, firstExpanded, maxVisible, maxExpanded} = self.props;
      const {frames} = analysis;
      const beyondVisible = Math.min(frames.size, firstVisible + maxVisible);
      const tailCount = frames.size - beyondVisible;
      const views = frames.reverse().slice(firstVisible, beyondVisible).map(function (frame, depth) {
        const focus = depth >= firstExpanded && depth < firstExpanded + maxExpanded;
        const view = viewFrame(core, frame, {locals: focus});
        view.focus = focus;
        return view;
      });
      return (
        <div className="stack-view" style={{height}}>
          <Button onClick={onStackUp} title="navigate up the stack">
            <i className="fa fa-arrow-up"/>
          </Button>
          <Button onClick={onStackDown} title="navigate down the stack">
            <i className="fa fa-arrow-down"/>
          </Button>
          {renderCallReturn()}
          {firstVisible > 0 &&
            <div key='tail' className="scope-ellipsis">
              {'… +'}{firstVisible}
            </div>}
          {views.map(renderFrame)}
          {tailCount > 0 &&
            <div key='tail' className="scope-ellipsis">
              {'… +'}{tailCount}
            </div>}
          <div className="stack-bottom" />
        </div>
      );
    };

  });

  StackView.defaultProps = {
    height: '100%',
    firstVisible: 0,
    maxVisible: 10,
    firstExpanded: 0,
    maxExpanded: 1
  };

  yield defineView('StackView', 'StackViewSelector', StackView);

};
