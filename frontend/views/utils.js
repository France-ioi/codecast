/*
This module contains React components that can be used to display values
extracted from the stepper by the analysis module.
*/

import React from 'react';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import * as C from 'persistent-c';
import range from 'node-range';

export const viewFrame = function (core, frame, options) {
  const view = {
    key: frame.get('scope').key,
    func: frame.get('func'),
    args: frame.get('args')
  };
  if (options.locals) {
    const localMap = frame.get('localMap');
    const locals = view.locals = [];
    frame.get('localNames').forEach(function (name) {
      const {type, ref} = localMap.get(name);
      // type and ref.type.pointee are assumed identical
      locals.push(viewVariable(core, name, type, ref.address));
    });
  }
  return view;
};

export const viewVariable = function (core, name, type, address) {
  const context = {scalars: 0, maxScalars: 15};
  return {
    name,
    type,
    address,
    value: readValue(core, C.pointerType(type), address, context)
  };
};

export const readValue = function (core, refType, address, context) {
  const type = refType.pointee;
  if (type.kind === 'array') {
    const cells = readArray(core, type, address, context);
    return {kind: 'array', count: type.count, cells};
  }
  if (context) {
    context.scalars += 1;
  }
  return readScalar(core, refType, address);
};

const readScalar = function (core, refType, address) {
  // Produce a 'stored scalar value' object whose shape is
  //   {ref, current, previous, load, store}
  // where:
  //   - 'ref' holds the value's reference (a pointer value)
  //   - 'current' holds the current value
  //   - 'load' holds the smallest rank of a load in the memory log
  //   - 'store' holds the greatest rank of a store in the memory log
  //   - 'previous' holds the previous value (if 'store' is defined)
  const ref = new C.PointerValue(refType, address);
  const result = {kind: 'scalar', ref: ref, current: C.readValue(core.memory, ref)}
  core.memoryLog.forEach(function (entry, i) {
    if (refsIntersect(ref, entry[1])) {
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
    result.previous = C.readValue(core.oldMemory, ref);
  }
  return result;
};

export const readArray = function (core, arrayType, address, context) {
  const elemCount = arrayType.count.toInteger();
  const elemType = arrayType.elem;
  const elemSize = elemType.size;
  const elemRefType = C.pointerType(elemType);
  const cells = [];
  let index;
  for (index = 0; index < elemCount; index += 1) {
    const content = readValue(core, elemRefType, address, context);
    cells.push({index, address, content});
    address += elemSize;
    if (context && context.scalars >= context.maxScalars) {
      break;
    }
  }
  if (index < elemCount) {
    index += 1;
    cells.push({index, address, content: {kind: 'ellipsis'}});
  }
  return cells;
};


export const readArray1D = function (core, arrayType, address, selection) {
  const elemCount = arrayType.count.toInteger();
  const elemType = arrayType.elem;
  const elemSize = elemType.size;
  const elemRefType = C.pointerType(elemType);
  const cells = [];
  if (selection === undefined) {
    selection = range(0, elemCount);
  }
  selection.forEach(function (index, position) {
    if (index === '…') {
      cells.push({position, ellipsis: true});
    } else {
      const elemAddress = address + index * elemSize;
      const cell = {position, index, address: elemAddress};
      if (index >= 0 && index < elemCount) {
        cell.content = readValue(core, elemRefType, elemAddress);
      }
      cells.push(cell);
    }
  });
  return cells;
};

export const readArray2D = function (core, arrayType, address) {
  const rowCount = arrayType.count.toInteger();
  const rowType = arrayType.elem;
  const rowSize = rowType.size;
  const colCount = rowType.count.toInteger();
  const cellType = rowType.elem;
  const cellSize = cellType.size;
  const cellRefType = C.pointerType(cellType);
  const rows = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = [];
    const rowAddress = address + rowIndex * rowSize;
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const cellAddress = rowAddress + colIndex * cellSize;
      const cell = readValue(core, cellRefType, cellAddress);
      row.push({index: colIndex, address: cellAddress, content: cell});
    }
    rows.push({index: rowIndex, address: rowAddress, content: row});
  }
  return rows;
};

const refsIntersect = function (ref1, ref2) {
  const base1 = ref1.address, limit1 = base1 + ref1.type.pointee.size - 1;
  const base2 = ref2.address, limit2 = base2 + ref2.type.pointee.size - 1;
  const result = (base1 <= base2) ? (base2 <= limit1) : (base1 <= limit2);
  return result;
};

const parensIf = function (cond, elem) {
  return cond ? <span>{'('}{elem}{')'}</span> : elem;
};

export const renderValue = function (value) {
  if (value === undefined) {
    return 'noval';
  }
  if (value === null) {
    return 'void';
  }
  return value.toString();
};

export const StoredValue = EpicComponent(self => {

  self.render = function () {
    const {value} = self.props;
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
    return <span className='value'>{`unknown value kind ${value.kind}`}</span>;
  };

});

export const renderDeclType = function (type, subject, prec) {
  switch (type.kind) {
    case 'function':
      // TODO: print param types?
      return renderDeclType(type.result, <span>{parensIf(prec > 0, subject)}{'()'}</span>, 0);
    case 'pointer':
      return renderDeclType(type.pointee, <span>{'*'}{subject}</span>, 1);
    case 'array':
      return renderDeclType(type.elem, <span>{parensIf(prec > 0, subject)}{'['}{type.count && type.count.toString()}{']'}</span>, 0);
    case 'scalar':
      return <span>{type.repr}{' '}{subject}</span>;
    default:
      return `<invalid kind ${type.kind}>`;
  }
};

export const VarDecl = EpicComponent(self => {

  self.render = function () {
    const {name, type, address, value} = self.props;
    const subject = <span className='vardecl-name' title={address && '0x'+address.toString(16)}>{name}</span>;
    return (
      <div className='vardecl'>
        {renderDeclType(type, subject, 0)}
        {value && ' = '}
        {value && <span className='vardecl-value'><StoredValue value={value}/></span>}
      </div>
    );
  };

});

export const FunctionCall = EpicComponent(self => {

  self.render = function () {
    const {func, args} = self.props;
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

});

export const getIdent = function (expr, noVal) {
  if (!expr) {
    return noVal;
  }
  return expr[0] === 'ident' ? expr[1] : noVal;
};

export const getNumber = function (expr, noVal) {
  if (!expr) {
    return noVal;
  }
  return expr[0] === 'number' ? expr[1] : noVal;
};

export const getList = function (expr, noVal) {
  if (!expr) {
    return noVal;
  }
  return expr[0] === 'list' ? expr[1] : noVal;
};

export const ShowVar = EpicComponent(self => {

  self.render = function () {
    const {directive, controls, frames, context} = self.props;
    const {byPos} = directive;
    const name = getIdent(byPos[0]);
    const frame = frames[0];
    const localMap = frame.get('localMap');
    if (!localMap.has(name)) {
      return <p>{name}{" not in scope"}</p>;
    }
    const {type, ref} = localMap.get(name);
    const value = readValue(
      context.core, C.pointerType(type), ref.address,
      {scalars: 0, maxScalars: 100});
    return <VarDecl name={name} type={type} address={ref.address} value={value} />;
  };

});
