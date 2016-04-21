
import React from 'react';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import {readValue} from 'persistent-c';

export const DirectivesPane = EpicComponent(self => {

  const refsIntersect = function (ref1, ref2) {
    const base1 = ref1.address, limit1 = base1 + ref1.type.size - 1;
    const base2 = ref2.address, limit2 = base2 + ref2.type.size - 1;
    const result = (base1 <= base2) ? (base2 <= limit1) : (base1 <= limit2);
    return result;
  };

  const prepareVariable = function (scope, state) {
    const {ref, decl} = scope;
    const {memoryLog, memory, oldMemory} = state;
    const {name} = decl;
    const {type, address} = ref;
    const limit = address + type.size - 1;
    const value = readValue(memory, ref);
    const result = {name, value, type: type.pointee};
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

  const prepareDirective = function (directive, scope, decls, state) {
    const kind = directive[0];
    const result = {kind, key: scope.key};
    switch (kind) {
      case 'showVar':
        {
          const ident = result.name = directive[1][0][1];
          const varScope = decls[ident];
          result.variable = varScope && prepareVariable(varScope, state)
          break;
        }
      default:
        result.error = `unknown directive ${kind}`;
        return
    }
    return result;
  };

  const getViews = function (state) {
    const views = [];
    let decls = {};
    let scope = state.scope;
    while (scope) {
      switch (scope.kind) {
        case 'param':
        case 'vardecl':
          {
            const name = scope.decl.name;
            if (!(name in decls)) {
              decls[scope.decl.name] = scope;
            }
          }
          break;
        case 'function':
          scope.directives.forEach(directive => views.push(prepareDirective(directive, scope, decls, state)));
          decls = {};
          break;
        case 'block':
          scope.directives.forEach(directive => views.push(prepareDirective(directive, scope, decls, state)));
          break;
      }
      scope = scope.parent;
    }
    return views;
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

  const renderVariable = function (view) {
    return (
      <div className="variable-view">
        <span className="variable-type">{renderType(view.type, 0)}</span>
        {' '}
        <span className="variable-name">{view.name}</span>
        {' = '}
        <span className={classnames(['variable-value', view.load !== undefined && 'variable-load'])}>{renderValue(view.value)}</span>
        {view.prevValue && <span className="variable-prevValue">{renderValue(view.prevValue)}</span>}
      </div>
    );
  };

  const renderShowVar = function (view) {
    // view.name
    return view.variable && renderVariable(view.variable);
  };

  const renderFuncs = {
    showVar: renderShowVar
  };

  const renderView = function (view) {
    const {key, kind} = view;
    const renderFunc = renderFuncs[kind];
    return (
      <div key={key} className="directive-view">
        {renderFunc && renderFunc(view)}
      </div>
    );
  };

  self.render = function () {
    const {state} = self.props;
    const views = getViews(state);
    console.log(views);
    return <div className="directive-pane">{views.map(view =>
      renderView(view))}</div>;
  };

});

export default DirectivesPane;
