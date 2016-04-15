
import React from 'react';
import EpicComponent from 'epic-component';
import {deref} from 'persistent-c';

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
    switch (type[0]) {
      case 'builtin':
        return type[1];
      case 'pointer':
        return renderType(type[1], 1) + '*';
    }
    return JSON.stringify(type);
  };

  const renderValue = function (value) {
    if (value === undefined)
      return 'undefined';
    switch (value[0]) {
      case 'integer':
        return value[1].toString();
      case 'floating':
        return value[1].toString();
    }
    return JSON.stringify(value);
  };

  const renderDecl = function (state, decl) {
    return (
      <div className="scope-decl">
        <span>{renderType(decl.type, 0)}</span>
        {' '}
        <span>{decl.name}</span>
        {' = '}
        <span>{renderValue(deref(state, decl.ref, decl.type))}</span>
      </div>
    );
  };

  const renderFrame = function (state, frame) {
    const key = frame.scope.key;
    return (
      <div key={key} className="scope-function">
        <span>{"function "}{frame.name}</span>
        <ul>{frame.params.map(scope =>
          <li key={scope.key}>{renderDecl(state, scope.decl)}</li>)}</ul>
        <div className="scope-function-blocks">
          {frame.blocks.map(block =>
            <div key={block.scope.key}>
              <ul>{block.decls.map(scope =>
                <li key={scope.key}>{renderDecl(state, scope.decl)}</li>)}</ul>
            </div>)}
        </div>
      </div>
    );
  };

  self.render = function () {
    /* TODO: take effects since previous step as a prop */
    const {state} = self.props;
    const frames = getFrames(state.scope);
    console.log('frames', frames);
    return <div className="stack-view">{frames.map(frame =>
      renderFrame(state, frame))}</div>;
  };

});

export default StackView;
