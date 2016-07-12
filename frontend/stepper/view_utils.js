/*
This module contains React components that can be used to display values
extracted from the stepper by the analysis module.
*/

import React from 'react';
import classnames from 'classnames';
import EpicComponent from 'epic-component';

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

export const VarDecl = EpicComponent(self => {

  const renderDeclType = function (type, subject, prec) {
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
