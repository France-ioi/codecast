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

export const Array1D = EpicComponent(self => {

  const renderCell = function (cell, i) {
    const {content, cursors, prevCursors, last} = cell;
    const cellClasses = [
      'array-cell',
      last && 'array-lastCell'
    ];
    const valueClasses = [
      'value',
      'load' in content && 'value-load'
    ];
    return (
      <div className={classnames(cellClasses)} key={i}>
        <div className='value-previous'>
          {'store' in content && renderValue(content.previous)}
        </div>
        <div className={classnames(valueClasses)}>
          {renderValue(content.current)}
        </div>
        <div className='array-cursors'>
          {cursors && cursors.map(c => <span key={c}>{c}</span>)}
          {prevCursors && prevCursors.map(c => <span key={c} className='value-previous'>{c}</span>)}
        </div>
      </div>
    );
  };

  self.render = function () {
    const {cells} = self.props;
    return (
      <div className='array-cells clearfix'>
        {cells.map(renderCell)}
      </div>
    );
  };

});

export const Array1DSvg = EpicComponent(self => {

    // @11px, line height 17, offset 12
  const textLineHeight = 17;
  const textBaseline = 5; // from bottom
  const cellWidth = 28;
  const cellHeight = 4 * textLineHeight + 20;

  const baseline = function (i) {
    return textLineHeight * (i + 1) - textBaseline;
  };

  const arrowPoints = function (x0, y0, width, height) {
    const dx1 = width;
    const dx2 = width / 5;
    const dy1 = height / 3;
    const dy2 = height;
    return `${x0},${y0} ${x0-dx1},${y0+dy1} ${x0-dx2},${y0+dy1} ${x0-dx2},${y0+dy2} ${x0+dx2},${y0+dy2} ${x0+dx2},${y0+dy1} ${x0+dx1},${y0+dy1} ${x0},${y0}`;
  }

  const renderCell = function (cell, i) {
    const {content, cursors, last} = cell;
    // cell.prevCursors not used
    const cellClasses = [
      'array-cell',
      last && 'array-lastCell'
    ];
    const valueClasses = [
      'value',
      'load' in content && 'value-load'
    ];
    // <line x1="10" x2="50" y1="110" y2="150" stroke="orange" fill="transparent" stroke-width="5"/>
    const y0 = baseline(0);
    const y0a = y0 - (textLineHeight - textBaseline) / 3;
    const y1 = baseline(1);
    const y2 = baseline(2);
    return (
      <g transform={`translate(${5 + i * cellWidth},5)`} clipPath="url(#cell)">
        {'store' in content && <g>
          <text x={cellWidth/2} y={y0} textAnchor="middle" fill="#777">
            {renderValue(content.previous)}
          </text>
          <line x1={2} x2={cellWidth-2} y1={y0a} y2={y0a} stroke="#777" strokeWidth="2"/>
        </g>}
        {last ||
          <g>
            <rect x="0" y={textLineHeight} width={cellWidth} height={textLineHeight} stroke="black" fill={cursors.length > 0 ? '#eef' : 'transparent'} strokeWidth="1"/>
            <text x={cellWidth/2} y={y1} textAnchor="middle">
              {renderValue(content.current)}
            </text>
          </g>}
        <text x={cellWidth/2} y={y2} textAnchor="middle" fill="#777">{i}</text>
        {cursors.length > 0 &&
          <g>
            <polygon points={arrowPoints(cellWidth/2, textLineHeight * 3, 6, 20)}/>
            <text x={cellWidth/2} y={cellHeight - textBaseline} textAnchor="middle">
              {cursors.join(' ')}
            </text>
          </g>}
      </g>
    );
  };

  self.render = function () {
    const {cells} = self.props;
    return (
      <div className='clearfix'>
        <svg width="100%" viewBox={`0 0 1000 ${cellHeight}`} version="1.1" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="cell">
              <rect x="0" y="0" width={cellWidth} height={cellHeight} stroke-width="5"/>
          </clipPath>
          {cells.map(renderCell)}
        </svg>
      </div>
    );
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
