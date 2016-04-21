
import React from 'react';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import {inspectPointer, pointerType, PointerValue} from 'persistent-c';

const intersperse = function (elems, sep) {
  if (elems.length === 0) {
    return [];
  }
  const f = function (xs, x, i) {
    return xs.concat([sep, x]);
  };
  return elems.slice(1).reduce(f, [elems[0]]);
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

const renderValue = function (view) {
  const classes = [view.load !== undefined && 'value-loaded'];
  return (
    <span className="value">
      <span className={classnames(classes)}>{view.value.toString()}</span>
      {view.prevValue && <span className="value-previous">{view.prevValue.toString()}</span>}
    </span>
  );
};

const ShowVar = EpicComponent(self => {
  self.render = function () {
    const {view} = self.props;
    const {name, value} = view;
    if (!value) {
      return <p>{name} not in scope</p>;
    }
    return (<div className="variable-view">
      <span className="variable-type">{renderType(value.type, 0)}</span>
      {' '}
      <span className="variable-name">{name}</span>
      {' = '}
      {renderValue(value)}
    </div>);
  };
});

const ShowArray = EpicComponent(self => {
  self.render = function () {
    const {view} = self.props;
    const {name, elemType, elemCount, values} = view;
    if (!values) {
      return <p>{name} not in scope</p>;
    }
    const valueElems = values.map(value => renderValue(value));
    return (<div className="constant-array-view">
      <span className="constant-array-type">{renderType(elemType, 0)}</span>
      {' '}
      <span className="variable-name">{name}</span>
      {'['}
      {elemCount}
      {'] = {'}
      {intersperse(valueElems, ', ')}
      {'}'}
    </div>);
  };
});

export const DirectivesPane = EpicComponent(self => {

  const getIdent = function (expr) {
    return expr[0] === 'ident' && expr[1];
  };

  const prepareDirective = function (directive, scope, decls, state) {
    const kind = directive[0];
    const result = {kind, key: scope.key};
    switch (kind) {
      case 'showVar':
        {
          const ident = result.name = getIdent(directive[1][0]);
          if (!ident) {
            result.error = 'invalid variable name';
            break;
          }
          const varScope = decls[ident];
          if (varScope) {
            result.value = inspectPointer(varScope.ref, state);
          }
          break;
        }
      case 'showArray':
        {
          const ident = result.name = getIdent(directive[1][0]);
          const varScope = decls[ident];
          if (varScope) {
            // Expect varScope.ref to be a pointer to a constant array.
            if (varScope.ref.type.kind !== 'pointer') {
              result.error = 'reference is not a pointer';
              break;
            }
            const varType = varScope.ref.type.pointee;
            if (varType.kind !== 'constant array') {
              result.error = 'expected a reference to a constant array';
            }
            // Extract the array's address, element type and count.
            const address = result.address = varScope.ref.address;
            const elemType = result.elemType = varType.elem;
            const elemCount = result.elemCount = varType.count.toInteger();
            // Inspect each array element.
            const values = result.values = [];
            const ptr = new PointerValue(pointerType(elemType), address);
            for (let elemIndex = 0; elemIndex < elemCount; elemIndex += 1) {
              values.push(inspectPointer(ptr, state));
              ptr.address += elemType.size;
            }
          }
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

  const Components = {
    showVar: ShowVar,
    showArray: ShowArray
  };

  const renderView = function (view) {
    const {key, kind} = view;
    const Component = Components[kind];
    return (
      <div key={key} className="directive-view">
        {Component ? <Component view={view}/> : <p>Bad component {kind}</p>}
      </div>
    );
  };

  self.render = function () {
    const {state} = self.props;
    const views = getViews(state);
    return <div className="directive-pane">{views.map(renderView)}</div>;
  };

});

export default DirectivesPane;
