
import React from 'react';
import classnames from 'classnames';

const parensIf = function (cond, elem) {
  return cond ? <span>{'('}{elem}{')'}</span> : elem;
};

export const renderValue = function (value) {
  return value === null ? 'void' : value.toString();
};

export const renderStoredValue = function (value) {
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
    // Value shape is {count, elems}, where elems is an array of objects of
    // shape {index, view}
    const {elems} = value;
    return (
      <span className='value value-array'>
        {'{'}
        {elems.map((elem, i) =>
          <span key={elem.index}>
            <span className='value-array-elem'>
              {renderStoredValue(elem.value)}
            </span>
            {i + 1 === elems.length || ', '}
          </span>
        )}
        {'}'}
      </span>
    );
  }
  return <span className='value'>{`unknown value kind ${value.kind}`}</span>;
};

export const renderDeclRec = function (type, subject, prec) {
  switch (type.kind) {
    case 'function':
      // TODO: print param types?
      return renderDeclRec(type.result, <span>{parensIf(prec > 0, subject)}{'()'}</span>, 0);
    case 'pointer':
      return renderDeclRec(type.pointee, <span>{'*'}{subject}</span>, 1);
    case 'array':
      return renderDeclRec(type.elem, <span>{parensIf(prec > 0, subject)}{'['}{type.count && type.count.toString()}{']'}</span>, 0);
    case 'scalar':
      return <span>{type.repr}{' '}{subject}</span>;
    default:
      return `<invalid kind ${type.kind}>`;
  }
};

export const renderVarDecl = function (view) {
  const {name, type, address, value} = view;
  const subject = <span className='vardecl-name' title={address && '0x'+address.toString(16)}>{name}</span>;
  return (
    <div className='vardecl'>
      {renderDeclRec(type, subject, 0)}
      {view.value && ' = '}
      {view.value && <span className='vardecl-value'>{renderStoredValue(value)}</span>}
    </div>
  );
};

export const renderCall = function (func, args) {
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
