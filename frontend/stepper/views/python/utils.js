/*
This module contains React components that can be used to display values
extracted from the stepper by the analysis module.
*/

import React from 'react';
import classnames from 'classnames';
import * as C from 'persistent-c';
import DirectiveFrame from "../DirectiveFrame";

/**
 * Gets the scope's loaded references from a variable name.
 *
 * @param {object} analysis The analysis.
 * @param {string} name     The variable name.
 *
 * @return {object|null}
 */
export const getLoadedReferencesFromVariable = function(analysis, name) {
  // Check in the last (the current) and the first (which is the global) scopes.

  const nbScopes = analysis.functionCallStack.size;
  if (getVariableInScope(analysis.functionCallStack.get(nbScopes - 1), name)) {
    return analysis.functionCallStack.get(nbScopes - 1).loadedReferences;
  }
  if (nbScopes > 1 && getVariableInScope(analysis.functionCallStack.get(0), name)) {
    return analysis.functionCallStack.get(0).loadedReferences;
  }

  return {};
};

/**
 * Gets a variable by name in analysis.
 *
 * @param {object} analysis The analysis.
 * @param {string} name     The name.
 *
 * @return {object|null}
 */
export const getVariable = function(analysis, name) {
  // Check in the last (the current) and the first (which is the global) scopes.

  const nbScopes = analysis.functionCallStack.size;
  let variable = getVariableInScope(analysis.functionCallStack.get(nbScopes - 1), name);
  if (!variable && nbScopes > 1) {
    variable = getVariableInScope(analysis.functionCallStack.get(0), name);
  }

  return variable;
};

/**
 * Gets a variable by name in a scope.
 *
 * @param {object} scope The scope.
 * @param {string} name  The name.
 *
 * @return {object|null}
 */
const getVariableInScope = function(scope, name) {
  if (scope.variables.has(name)) {
    return scope.variables.get(name);
  }

  return null;
};

export const readScalarBasic = function (programState, refType, address) {
  // Produce a 'basic stored scalar value' object whose shape is
  //   {kind, ref, current}
  // where:
  //   - 'kind' is always 'scalar'
  //   - 'ref' holds the value's reference (a pointer value)
  //   - 'current' holds the current value
  const kind = 'scalar';
  const ref = new C.PointerValue(refType, address);
  const current = C.readValue(programState, ref);
  return {kind, ref, current};
};

export const readScalar = function (context, refType, address) {
  // Produce a 'stored scalar value' object whose shape is
  //   {kind, ref, current, previous, load, store}
  // where:
  //   - 'kind', 'ref', 'current' are as returned by readScalarBasic
  //   - 'load' holds the smallest rank of a load in the memory log
  //   - 'store' holds the greatest rank of a store in the memory log
  //   - 'previous' holds the previous value (if 'store' is defined)
  const {programState, lastProgramState} = context;
  const result = readScalarBasic(programState, refType, address);
  programState.memoryLog.forEach(function (entry, i) {
    /* FIXME: when ref is a pointer type, the length of the value written
              to it should be used to decide if the ranges intersect */
    if (refsIntersect(result.ref, entry[1])) {
      if (entry[0] === 'load') {
        if (result.load === undefined) {
          result.load = i;
        }
      } else if (entry[0] === 'store') {
        result.store = i;
      }
    }
  });
  if ('store' in result) {
    result.previous = C.readValue(lastProgramState, result.ref);
  }
  return result;
};

export const readValue = function (context, refType, address, limits) {
  const type = refType.pointee;
  if (type.kind === 'array') {
    if (type.count === undefined) {
      /* Array of unknown size, display as pointer */
      return {kind: 'scalar', current: new C.PointerValue(refType, address)};
    } else {
      const cells = readArray(context, type, address, limits);
      return {kind: 'array', count: type.count, cells};
    }
  }
  if (type.kind === 'record') {
    const fields = readRecord(context, type, address, limits);
    return {kind: 'record', name: type.name, fields};
  }
  if (limits) {
    limits.scalars += 1;
  }
  return readScalar(context, refType, address);
};

export const readArray = function (context, arrayType, address, limits) {
  const elemCount = arrayType.count.toInteger();
  const elemType = arrayType.elem;
  const elemSize = elemType.size;
  const elemRefType = C.pointerType(elemType);
  const cells = [];
  let index;
  for (index = 0; index < elemCount; index += 1) {
    const content = readValue(context, elemRefType, address, context);
    cells.push({index, address, content});
    address += elemSize;
    if (limits && limits.scalars >= limits.maxScalars) {
      break;
    }
  }
  if (index < elemCount) {
    index += 1;
    cells.push({index, address, content: {kind: 'ellipsis'}});
  }
  return cells;
};

export const readRecord = function (context, recordType, address, limits) {
  const fields = [];
  for (let fieldName of recordType.fields) {
    const {offset, type} = recordType.fieldMap[fieldName];
    const fieldAddress = address + offset;
    const content = readValue(context, C.pointerType(type), fieldAddress, limits);
    fields.push({name: fieldName, address: fieldAddress, content});
    if (limits && limits.scalars >= limits.maxScalars) {
      break;
    }
  }
  if (fields.length < recordType.fields.length) {
    fields.push({ellipsis: true});
  }
  return fields;
};


export const refsIntersect = function (ref1, ref2) {
  const base1 = ref1.address, limit1 = base1 + ref1.type.pointee.size - 1;
  const base2 = ref2.address, limit2 = base2 + ref2.type.pointee.size - 1;

  return (base1 <= base2) ? (base2 <= limit1) : (base1 <= limit2);
};

const strParensIf = function (cond, str) {
  return cond ? `(${str})` : str;
};

export const stringifyExpr = function (expr, precedence) {
  precedence = precedence || 0;
  if (expr[0] === 'parens') {
    return strParensIf(true, stringifyExpr(expr[1], 0));
  }
  if (expr[0] === 'ident' || expr[0] === 'number') {
    return expr[1].toString();
  }
  if (expr[0] === 'deref') {
    return strParensIf(precedence > 1, `*${stringifyExpr(expr[1], 1)}`);
  }
  if (expr[0] === 'subscript') {
    return strParensIf(
      precedence > 2,
      `${stringifyExpr(expr[1], 2)}[${stringifyExpr(expr[2], 0)}]`);
  }
  if (expr[0] === 'addrOf') {
    return `&${stringifyExpr(expr[1], 0)}`;
  }
  return JSON.stringify(expr);
};

export const viewExprs = function (programState, stackFrame, exprs) {
  const localMap = stackFrame.get('localMap');
  const views = [];
  exprs.forEach(function (expr) {
    const label = stringifyExpr(expr, 0);
    try {
      const value = evalExpr(programState, localMap, expr, false);
      views.push({label, value});
    } catch (ex) {
      views.push({label, error: ex.toString});
    }
  });
  return views;
};

export const viewVariable = function (context, name, type, address) {
  const limits = {scalars: 0, maxScalars: 15};
  return {
    name,
    type,
    address,
    value: readValue(context, C.pointerType(type), address, limits)
  };
};

//

const parensIf = function (cond, elem) {
  return cond ? <span>{'('}{elem}{')'}</span> : elem;
};

export const renderValue = function (value) {
  if (value === undefined) {
    return 'noval';
  }
  if (value === null) {
    return 'null';
  }

  return value.toString();
};

export function StoredValue ({value}) {
  if (value.kind === 'ellipsis') {
    return <span className='value value-ellipsis'>{'…'}</span>;
  }
  if (value.kind === 'scalar') {
    // Value shape is {ref, current, previous, load, store}, see analysis.js for
    // details.
    return (
      <span className='value'>
        <span className={classnames(['load' in value && 'value-load'])}>
          {renderValue(value.current)}
        </span>
        {'store' in value &&
          <span className='value-previous'>
            {renderValue(value.previous)}
          </span>}
      </span>
    );
  }
  if (value.kind === 'array') {
    const {cells} = value;
    return (
      <span className='value value-array'>
        {'{'}
        {cells.map((cell, i) =>
          <span key={cell.index}>
            <span className='value-array-cell'>
              <StoredValue value={cell.content}/>
            </span>
            {i + 1 === cells.length || ', '}
          </span>
        )}
        {'}'}
      </span>
    );
  }
  if (value.kind === 'record') {
    const {fields} = value;
    return (
      <span className='value value-record'>
        {'{'}
        {fields.map((field, i) =>
          <span key={field.name}>
            <span className='value-record-field' title={field.name}>
              <StoredValue value={field.content}/>
            </span>
            {i + 1 === fields.length || ', '}
          </span>
        )}
        {'}'}
      </span>
    );
  }
  return <span className='value'>{`unknown value kind ${value.kind}`}</span>;
}

export const renderDeclType = function (type, subject, prec) {
  switch (type.kind) {
    case 'function':
      // TODO: print param types?
      return renderDeclType(type.result, <span>{parensIf(prec > 0, subject)}{'()'}</span>, 0);
    case 'pointer':
      return renderDeclType(type.pointee, <span>{'*'}{subject}</span>, 1);
    case 'array':
      return renderDeclType(type.elem, <span>{parensIf(prec > 0, subject)}{'['}{type.count && type.count.toString()}{']'}</span>, 0);
    case 'record':
      return <span>{'struct'}{' '}{type.name}{' '}{subject}</span>;
    case 'builtin':
      return <span>{type.repr}{' '}{subject}</span>;
    default:
      return `<invalid kind ${type.kind}>`;
  }
};

export function VarDecl ({name, type, address, value}) {
  const subject = <span className='vardecl-name' title={address && '0x'+address.toString(16)}>{name}</span>;
  return (
    <div className='vardecl'>
      {renderDeclType(type, subject, 0)}
      {value && ' = '}
      {value && <span className='vardecl-value'><StoredValue value={value}/></span>}
    </div>
  );
}

export function ShowVar (props) {
  const {directive, functionCallStack, context} = props;
  const {byPos} = directive;
  const name = getIdent(byPos[0]);
  const stackFrame = functionCallStack[0];
  const localMap = stackFrame.get('localMap');
  if (!localMap.has(name)) {
    return <p>{name}{" not in scope"}</p>;
  }
  const {type, ref} = localMap.get(name);
  const limits = {scalars: 0, maxScalars: 100};
  const value = readValue(context, C.pointerType(type), ref.address, limits);
  return (
    <DirectiveFrame {...props}>
      <VarDecl name={name} type={type} address={ref.address} value={value} />
    </DirectiveFrame>
  );
}

const computeArrowPoints = function (p, headSize, tailSize) {
  const dx1 = headSize;
  const dy1 = headSize;
  const dx2 = headSize / 5;
  const dy2 = tailSize;
  return [p(0,0), p(-dx1,dy1), p(-dx2,dy1), p(-dx2,dy2), p(dx2,dy2), p(dx2,dy1), p(dx1,dy1), p(0,0)].join(' ');
};
const arrowDirFunc = {
  up:    (dx,dy) => `${+dx},${+dy}`,
  down:  (dx,dy) => `${+dx},${-dy}`,
  left:  (dx,dy) => `${+dy},${+dx}`,
  right: (dx,dy) => `${-dy},${+dx}`
};
export const renderArrow = function (x, y, dir, headSize, tailSize, style) {
  const ps = computeArrowPoints(arrowDirFunc[dir], headSize, tailSize);
  return <polygon points={ps} transform={`translate(${x},${y})`} {...style} />;
};

export const highlightColors = [
  {fg: '#2196F3', bg: '#BBDEFB', name: 'blue'},
  {fg: '#4CAF50', bg: '#C8E6C9', name: 'green'},
  {fg: '#F44336', bg: '#FFCDD2', name: 'red'},
  {fg: '#00BCD4', bg: '#B2EBF2', name: 'cyan'},
  {fg: '#FFEB3B', bg: '#FFF9C4', name: 'yellow'},
  {fg: '#9C27B0', bg: '#E1BEE7', name: 'purple'},
  {fg: '#FF9800', bg: '#FFE0B2', name: 'orange'},
  {fg: '#9E9E9E', bg: '#F5F5F5', name: 'grey'},
  {fg: '#03A9F4', bg: '#B3E5FC', name: 'light blue'},
  {fg: '#8BC34A', bg: '#DCEDC8', name: 'light green'},
  {fg: '#E91E63', bg: '#F8BBD0', name: 'pink'},
  {fg: '#009688', bg: '#B2DFDB', name: 'teal'},
  {fg: '#FFC107', bg: '#FFECB3', name: 'amber'},
  {fg: '#673AB7', bg: '#D1C4E9', name: 'deep purple'},
  {fg: '#FF5722', bg: '#FFCCBC', name: 'deep orange'},
  {fg: '#607D8B', bg: '#CFD8DC', name: 'blue grey'},
  {fg: '#795548', bg: '#D7CCC8', name: 'brown'},
  {fg: '#CDDC39', bg: '#F0F4C3', name: 'lime'},
  {fg: '#3F51B5', bg: '#C5CAE9', name: 'indigo'}
];

export const noColor = {fg: '#777777', bg: '#F0F0F0', name: 'light gray'};
