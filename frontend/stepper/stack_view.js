
import React from 'react';
import classnames from 'classnames';
import {Alert} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';
import {analyseState, viewFrame} from './analysis';

export default function* (deps) {

  yield use('stepperExit');

  yield defineSelector('StackViewSelector', function (state, props) {
    return {state: state.getIn(['stepper', 'display'])};
  });

  const StackView = EpicComponent(self => {

    const parensIf = function (cond, elem) {
      return cond ? <span>{'('}{elem}{')'}</span> : elem;
    };

    const renderDecl = function (type, subject, prec) {
      // XXX handle precedence, •[]/•() bind tighter than *•
      // i.e. int *a[]   declares a as array of pointer to int
      //      int (*a)[] declares a as pointer to array of int
      switch (type.kind) {
        case 'function':
          // TODO: add params
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
            const subject = <span title={ref && '0x'+ref.address.toString(16)}>{name}</span>;
            const ref = value && value.ref;
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
      // {func, args, locals}
      return (
        <div>
          {renderFunctionHeader(view)}
          {view.locals && renderFunctionLocals(view.locals)}
        </div>
      );
    };

    const renderCallReturn = function (callReturn) {
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

    self.render = function () {
      /* TODO: take effects since previous step as a prop */
      const {state, height, firstVisible, maxVisible, firstExpanded, maxExpanded} = self.props;
      if (!state) {
        return (
          <div className="stack-view" style={{height}}>
            <p>Programme arrêté.</p>
          </div>
        );
      }
      if (state.error) {
        return (
          <div className="stack-view" style={{height}}>
            <Alert bsStyle="danger" onDismiss={onExit}>
              <h4>Erreur</h4>
              <p>{state.error.toString()}</p>
            </Alert>
          </div>
        );
      }
      const {frames, callReturn} = analyseState(state);
      const beyondVisible = Math.min(frames.size, firstVisible + maxVisible);
      const tailCount = frames.size - beyondVisible;
      const views = frames.reverse().slice(firstVisible, beyondVisible).map(function (frame, depth) {
        const locals = depth >= firstExpanded && depth < maxExpanded;
        return viewFrame(state, frame, {locals});
      });
      return (
        <div className="stack-view" style={{height}}>
          {callReturn && renderCallReturn(callReturn)}
          {firstVisible > 0 && <div key='tail' className="scope-ellipsis">
            {'… +'}{firstVisible}
          </div>}
          {views.map(view => renderFrame(view))}
          {tailCount > 0 && <div key='tail' className="scope-ellipsis">
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
