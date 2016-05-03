
import React from 'react';
import {Panel} from 'react-bootstrap';
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
      {view.prevValue && <span className="value-changed">{view.prevValue.toString()}</span>}
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
    const header = (
      <span>
        <span className="variable-type">{renderType(value.type, 0)}</span>
        {' '}
        <span className="variable-name">{name}</span>
        {' = '}
      </span>);
    return <Panel className="variable-decl" header={header}>{renderValue(value)}</Panel>;
  };
});

const ShowArray = EpicComponent(self => {
  self.render = function () {
    const {view} = self.props;
    const {name, elemType, elemCount, elems} = view;
    if (!elems) {
      return <p>{name} not in scope</p>;
    }
    // TODO: cursors
    const renderArrayElem = function (elem, i) {
      const {value, cursors, prevCursors} = elem;
      const valueClasses = [
        "constantArray-elemValue",
        value.load !== undefined && 'value-loaded'
      ];
      return (
        <div className="constantArray-elemView" key={i}>
          <div className="value-changed">
            {value.prevValue && value.prevValue.toString()}
          </div>
          <div className={classnames(valueClasses)}>
            {value.value && value.value.toString()}
          </div>
          <div className="constantArray-cursors">
            {cursors && cursors.map(c => <span key={c}>{c}</span>)}
            {prevCursors && prevCursors.map(c => <span key={c} className="value-changed">{c}</span>)}
          </div>
        </div>
      );
    };
    const header = (
      <div className="constantArray-decl">
        <span className="constantArray-type">{renderType(elemType, 0)}</span>
        {' '}
        <span className="variable-name">{name}</span>
        {'['}
        {elemCount}
        {'] ='}
      </div>);
    return (
      <Panel className="constantArray-view" header={header}>
        <div className="constantArray-elems clearfix">
          {elems.map(renderArrayElem)}
        </div>
      </Panel>
    );
  };
});

export const DirectivesPane = EpicComponent(self => {

  const getIdent = function (expr) {
    return expr[0] === 'ident' && expr[1];
  };

  const prepareDirective = function (directive, scope, index, decls, state) {
    const kind = directive[0];
    const result = {kind, key: `${scope.key}.${index}`};
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
          const namedArgs = directive[2];
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
            const elems = result.elems = [];
            const ptr = new PointerValue(pointerType(elemType), address);
            for (let elemIndex = 0; elemIndex < elemCount; elemIndex += 1) {
              elems.push({value: inspectPointer(ptr, state), cursors: [], prevCursors: []});
              ptr.address += elemType.size;
            }
            // Add an extra empty element.
            elems.push({value: {}, cursors: [], prevCursors: []});
            // Cursors?
            if (namedArgs.cursors && namedArgs.cursors[0] === 'list') {
              const cursorIdents = namedArgs.cursors[1].map(getIdent);
              cursorIdents.forEach(function (cursorIdent) {
                const cursorScope = decls[cursorIdent];
                if (cursorScope) {
                  const cursorValue = inspectPointer(cursorScope.ref, state);
                  const cursorPos = cursorValue.value.toInteger();
                  if (cursorPos >= 0 && cursorPos <= elemCount) {
                    elems[cursorPos].cursors.push(cursorIdent);
                  }
                  if (cursorValue.prevValue) {
                    const cursorPrevPos = cursorValue.prevValue.toInteger();
                    if (cursorPrevPos >= 0 && cursorPrevPos <= elemCount) {
                      elems[cursorPrevPos].prevCursors.push(cursorIdent);
                    }
                  }
                }
              })
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
          scope.directives.forEach((directive, i) => views.push(prepareDirective(directive, scope, i, decls, state)));
          decls = {};
          break;
        case 'block':
          scope.directives.forEach((directive, i) => views.push(prepareDirective(directive, scope, i, decls, state)));
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
      <div key={key} className="directive-view clearfix">
        {Component ? <Component view={view}/> : <Panel>Bad component {kind}</Panel>}
      </div>
    );
  };

  self.render = function () {
    try {
      const {state} = self.props;
      const views = getViews(state);
      return <div className="directive-pane">{views.map(renderView)}</div>;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

});

export default DirectivesPane;
