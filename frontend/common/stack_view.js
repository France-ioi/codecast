
import React from 'react';
import EpicComponent from 'epic-component';
import {readValue} from 'persistent-c';

export const StackView = EpicComponent(self => {

  const getFrames = function (scope) {
    const frames = [];
    let blocks = [];
    let decls = [];
    let params = [];
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
          params.push(scope);
          break;
        case 'block':
          blocks.push({
            scope: scope,
            decls: decls
          });
          decls = [];
          break;
        case 'vardecl':
          decls.push(scope)
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

  const renderDecl = function (state, name, ref) {
    return (
      <div className="scope-decl">
        <span>{renderType(ref.type.pointee, 0)}</span>
        {' '}
        <span>{name}</span>
        {' = '}
        <span>{renderValue(readValue(state.memory, ref))}</span>
      </div>
    );
  };

  const renderFrame = function (state, frame) {
    const key = frame.scope.key;
    return (
      <div key={key} className="scope-function">
        <span>{"function "}{frame.name}</span>
        <ul>{frame.params.map(scope =>
          <li key={scope.key}>{renderDecl(state, scope.decl.name, scope.ref)}</li>)}</ul>
        <div className="scope-function-blocks">
          {frame.blocks.map(block =>
            <div key={block.scope.key}>
              <ul>{block.decls.map(scope =>
                <li key={scope.key}>{renderDecl(state, scope.decl.name, scope.ref)}</li>)}</ul>
            </div>)}
        </div>
      </div>
    );
  };

  self.render = function () {
    /* TODO: take effects since previous step as a prop */
    const {state} = self.props;
    const frames = getFrames(state.scope);
    return <div className="stack-view">{frames.map(frame =>
      renderFrame(state, frame))}</div>;
  };

});

export default StackView;
