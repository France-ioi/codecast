
import React from 'react';
import classnames from 'classnames';
import {Alert} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import {readValue} from 'persistent-c';

import {use, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  yield use('stepperExit');

  yield defineSelector('StackViewSelector', function (state, props) {
    return {state: state.getIn(['stepper', 'display'])};
  });

  yield defineView('StackView', 'StackViewSelector', EpicComponent(self => {

    const refsIntersect = function (ref1, ref2) {
      const base1 = ref1.address, limit1 = base1 + ref1.type.pointee.size - 1;
      const base2 = ref2.address, limit2 = base2 + ref2.type.pointee.size - 1;
      const result = (base1 <= base2) ? (base2 <= limit1) : (base1 <= limit2);
      return result;
    };

    const getScopeRef = function (scope, state) {
      const {key, ref, decl} = scope;
      const {memoryLog, memory, oldMemory} = state;
      const {name} = decl;
      const {type, address} = ref;
      const result = {key, name, type: type.pointee};
      if (type.pointee.kind === 'constant array') {
        return result;
      }
      result.value = readValue(memory, ref);
      try {
        memoryLog.forEach(function (entry, i) {
          if (refsIntersect(ref, entry[1])) {
            if (entry[0] === 'load') {
              if (result.load === undefined) {
                result.load = i;
              }
            } else if (entry[0] === 'store') {
              if (result.store === undefined) {
                result.store = i;
                result.prevValue = readValue(oldMemory, ref);
              }
            }
          }
        });
      } catch (err) {
        result.error = err;
      }
      return result;
    };

    const getFrames = function (state) {
      const frames = [];
      let blocks = [];
      let decls = [];
      let params = [];
      let scope = state.scope;
      let isReturn = state.control && state.control.return;
      let isTopFrame = !isReturn;
      let depth = 0;
      while (scope) {
        switch (scope.kind) {
          case 'function':
            if (depth <= 10) {
              frames.push({
                scope: scope,
                name: scope.block[2][0][1].identifier,
                params: params,
                blocks: isTopFrame && blocks,
                retVal: isReturn && state.result,
                isTop: isTopFrame
              });
            }
            isTopFrame = isReturn;
            isReturn = false;
            depth += 1;
            params = [];
            blocks = [];
            break;
          case 'param':
            if (depth <= 10) {
              params.unshift(getScopeRef(scope, state));
            }
            break;
          case 'block':
            if (isTopFrame && !isReturn) {
              blocks.unshift({
                scope: scope,
                decls: decls
              });
              decls = [];
            }
            break;
          case 'vardecl':
            if (isTopFrame && !isReturn) {
              decls.unshift(getScopeRef(scope, state));
            }
            break;
        }
        scope = scope.parent;
      }
      if (depth > 10) {
        frames.push({ellipsis: true, depth: depth});
      }
      return frames;
    };

    const renderType = function (type, prec) {
      switch (type.kind) {
        case 'scalar':
          return type.repr;
        case 'pointer':
          return renderType(type.pointee, 1) + '*';
      }
      return type.toString();
    };

    const renderValue = function (value) {
      if (value === undefined)
        return 'undefined';
      return value.toString();
    };

    const renderDecl = function (decl) {
      return (
        <div className="scope-decl">
          <span>{renderType(decl.type, 0)}</span>
          {' '}
          <span>{decl.name}</span>
          {decl.value && ' = '}
          {decl.value && <span className={classnames([decl.load !== undefined && 'scope-decl-load'])}>{renderValue(decl.value)}</span>}
          {decl.prevValue && <span className="scope-decl-prevValue">{renderValue(decl.prevValue)}</span>}
        </div>
      );
    };

    const renderFrameHeader = function (frame) {
      const {isTop, name, params} = frame;
      const paramCount = params.length;
      return (
        <div className={classnames(["scope-function-title", isTop && "scope-function-top"])}>
          {name}
          {'('}
          <span>
            {params.map(function (decl, i) {
              return (
                <span key={i}>
                  {renderValue(decl.value)}
                  {i + 1 < paramCount && ', '}
                </span>
              );
            })}
          </span>
          {')'}
        </div>
      );
    };

    const renderFrameParams = function (frame) {
      if (!frame.isTop){
        return false;
      }
      return (
        <div className="scope-function-params">
          <ul>
            {frame.params.map(function (decl) {
              return <li key={decl.key}>{renderDecl(decl)}</li>;
            })}
          </ul>
        </div>
      );
    };

    const renderFrameBlocks = function (frame) {
      const {blocks} = frame;
      if (!frame.blocks){
        return false;
      }
      return (
        <div className="scope-function-blocks">
          {blocks.map(function (block) {
            const {decls, scope} = block;
            if (decls.length === 0) {
              return false;
            }
            return (
              <div key={scope.key}>
                <ul>
                  {decls.map(function (decl) {
                    return <li key={decl.key}>{renderDecl(decl)}</li>;
                  })}
                </ul>
              </div>);
          })}
        </div>
      );
    };

    const renderFrame = function (state, frame) {
      if (frame.ellipsis) {
        return (
          <div key={key} className="scope-ellipsis">
            {'… ('}
            {frame.depth}
            {')'}
          </div>
        );
      }
      const key = frame.scope.key;
      return (
        <div key={key} className="scope-function">
          {renderFrameHeader(frame)}
          {renderFrameParams(frame)}
          {frame.retVal &&
            <div className="scope-function-return">
              <i className="fa fa-long-arrow-right"/>
              <span className="scope-function-retval">
                {renderValue(frame.retVal)}
              </span>
            </div>}
          {renderFrameBlocks(frame)}
        </div>
      );
    };

    const onExit = function () {
      self.props.dispatch({type: deps.stepperExit});
    };

    self.render = function () {
      /* TODO: take effects since previous step as a prop */
      const {state, height} = self.props;
      if (!state) {
        return (
          <div className="stack-view" style={{height: height||'100%'}}>
            <p>Programme arrêté.</p>
          </div>
        );
      }
      if (state.error) {
        return (
          <div className="stack-view" style={{height: height||'100%'}}>
            <Alert bsStyle="danger" onDismiss={onExit}>
              <h4>Erreur</h4>
              <p>{state.error.toString()}</p>
            </Alert>
          </div>
        );
      }
      const frames = getFrames(state);
      return (
        <div className="stack-view" style={{height: height||'100%'}}>
          {frames.map(frame => renderFrame(state, frame))}
          <div className="stack-bottom" />
        </div>
      );
    };

  }));

};
