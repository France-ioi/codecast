
import React from 'react';
import classnames from 'classnames';

const parensIf = function (cond, elem) {
  return cond ? <span>{'('}{elem}{')'}</span> : elem;
};

export const renderDecl = function (type, subject, prec) {
  switch (type.kind) {
    case 'function':
      // TODO: print param types?
      return renderDecl(type.result, <span>{parensIf(prec > 0, subject)}{'()'}</span>, 0);
    case 'pointer':
      return renderDecl(type.pointee, <span>{'*'}{subject}</span>, 1);
    case 'array':
      return renderDecl(type.elem, <span>{parensIf(prec > 0, subject)}{'['}{type.count && type.count.toString()}{']'}</span>, 0);
    case 'scalar':
      return <span>{type.repr}{' '}{subject}</span>;
    default:
      return type.kind.toString();
  }
};

export const renderValue = function (value) {
  return value === null ? 'void' : value.toString();
};

export const renderStoredValue = function (value) {
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
