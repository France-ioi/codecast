
import React from 'react';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import {readValue} from 'persistent-c';

export const StackView = EpicComponent(self => {

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
    const limit = address + type.size - 1;
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
    while (scope) {
      switch (scope.kind) {
        case 'function':
          frames.push({
            scope: scope,
            name: scope.block[2][0][1].identifier,
            params: params,
            blocks: blocks
          });
          params = [];
          blocks = [];
          break;
        case 'param':
          params.push(getScopeRef(scope, state));
          break;
        case 'block':
          blocks.push({
            scope: scope,
            decls: decls
          });
          decls = [];
          break;
        case 'vardecl':
          decls.push(getScopeRef(scope, state));
          break;
      }
      scope = scope.parent;
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

  const renderFrame = function (state, frame) {
    const key = frame.scope.key;
    return (
      <div key={key} className="scope-function">
        <span>{"function "}{frame.name}</span>
        <ul>{frame.params.map(decl =>
          <li key={decl.key}>{renderDecl(decl)}</li>)}</ul>
        <div className="scope-function-blocks">
          {frame.blocks.map(block =>
            <div key={block.scope.key}>
              <ul>{block.decls.map(decl =>
                <li key={decl.key}>{renderDecl(decl)}</li>)}</ul>
            </div>)}
        </div>
      </div>
    );
  };

  self.render = function () {
    /* TODO: take effects since previous step as a prop */
    const {state, height} = self.props;
    const frames = getFrames(state);
    return <div className="stack-view" style={{height: height||'100%'}}>{frames.map(frame =>
      renderFrame(state, frame))}</div>;
  };

});

export default StackView;
