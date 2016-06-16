
import React from 'react';
import classnames from 'classnames';
import {Alert, Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';
import {viewFrame} from './analysis';

export default function* (deps) {

  yield use('stepperExit', 'stepperStackUp', 'stepperStackDown');

  yield defineSelector('StackViewSelector', function (state, props) {
    const stepperState = state.getIn(['stepper', 'display']);
    if (!stepperState) {
      return {};
    }
    const {core, analysis, controls} = stepperState;
    const {maxVisible} = props;
    const stackControls = controls.get('stack');
    const focusDepth = stackControls.get('focusDepth', 0);
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

    const parensIf = function (cond, elem) {
      return cond ? <span>{'('}{elem}{')'}</span> : elem;
    };

    const renderDecl = function (type, subject, prec) {
      switch (type.kind) {
        case 'function':
          // TODO: print param types?
          return renderDecl(type.result, <span>{parensIf(prec > 0, subject)}{'()'}</span>, 0);
        case 'pointer':
          return renderDecl(type.pointee, <span>{'*'}{subject}</span>, 1);
        case 'array':
          return renderDecl(type.elem, <span>{parensIf(prec > 0, subject)}{'['}{type.count && type.count.toString()}{']'}</span>, 0);
        case 'scalar':
          return <span>{type.repr}{' '}{subject}</span>;
        default:
          return type.kind.toString();
      }
    };

    const renderValue = function (value) {
      if (value === null)
        return 'void';
      return value.toString();
    };

    const renderFunctionCall = function (func, args) {
      const argCount = args.length;
      return (
        <span>
          {func.name}
          {'('}
          <span>
            {args.map(function (value, i) {
              return (
                <span key={i}>
                  {renderValue(value)}
                  {i + 1 < argCount && ', '}
                </span>
              );
            })}
          </span>
          {')'}
        </span>
      );
    };

    const renderFunctionHeader = function (view) {
      const {func, args} = view;
      return (
        <div className={classnames(["scope-function-title", false && "scope-function-top"])}>
          {renderFunctionCall(func, args)}
        </div>
      );
    };

    const renderFunctionLocals = function (locals) {
      return (
        <div className="scope-function-blocks">
          <ul>
          {locals.map(function (view) {
            const {name, type, value} = view;
            const ref = value && value.ref;
            const subject = <span title={ref && '0x'+ref.address.toString(16)}>{name}</span>;
            return (
              <li key={name}>
                <div className="scope-decl">
                  <span>{renderDecl(type, subject, 0)}</span>
                  {value && ' = '}
                  {value &&
                    <span className={classnames([typeof value.load === 'number' && 'scope-decl-load'])}>
                      {renderValue(value.current)}
                    </span>}
                  {value && value.previous &&
                    <span className="scope-decl-prevValue">
                      {renderValue(value.previous)}
                    </span>}
                </div>
              </li>
            );
          })}
          </ul>
        </div>
      );
    };

    const renderFrame = function (view) {
      // {key, func, args, locals}
      return (
        <div key={view.key} className={classnames(['stack-frame', view.focus && 'stack-frame-focused'])}>
          {renderFunctionHeader(view)}
          {view.locals && renderFunctionLocals(view.locals)}
        </div>
      );
    };

    const renderCallReturn = function () {
      const {callReturn} = self.props;
      if (!callReturn) {
        return false;
      }
      const {func, args, result} = callReturn;
      const argCount = args.length;
      return (
        <div className="scope-function-return">
          {renderFunctionCall(func, args)}
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
