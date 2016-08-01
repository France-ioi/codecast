
import React from 'react';
import EpicComponent from 'epic-component';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';

import {getIdent, getNumber, getList, viewVariable, readArray1D, renderValue} from './utils';
import {ArrayViewBuilder} from './array_utils';

export const Array1D = EpicComponent(self => {

  // @11px, line height 15, offset 12
  const textLineHeight = 18;
  const textBaseline = 5; // from bottom
  const minArrowHeight = 20;
  const cursorRows = 2;
  const cellWidth = 28;
  const cellHeight = (3 + cursorRows) * textLineHeight + minArrowHeight;
  const gridStroke = "#777";
  const gridStrokeWidth = "1";
  const pointsByKind = {
    cursor: 300,
    write: 100,
    read: 50,
    first: 25,
    last: 20
  };

  const extractView = function () {
    const {directive, controls, frames, context} = self.props;
    const {core} = context;
    // 'name' is the first positional argument
    const {byName, byPos} = directive;
    const cursorNames = getList(byName.cursors, []).map(getIdent);
    const maxVisibleCells = getNumber(byName.n, 40);
    const name = getIdent(byPos[0]);
    // Use the topmost frame.
    // TODO: look in globals if frames.length === 0
    const frame = frames[0];
    const localMap = frame.get('localMap');
    if (!localMap.has(name)) {
      return {error: <p>{name}{" not in scope"}</p>};
    }
    const {type, ref} = localMap.get(name);
    // Expect an array declaration.
    if (type.kind !== 'array') {
      return {error: <p>{"value is not an array"}</p>};
    }
    const elemCount = type.count.toInteger();
    const builder = new ArrayViewBuilder(maxVisibleCells, elemCount);
    builder.addMarker(0, pointsByKind.first);
    builder.addMarker(elemCount, pointsByKind.last);
    // Inspect cursors.
    const cursorMap = {};
    cursorNames.forEach(function (cursorName) {
      if (localMap.has(cursorName)) {
        const {type, ref} = localMap.get(cursorName);
        const decl = viewVariable(core, cursorName, type, ref.address);
        const cursorPos = decl.value.current.toInteger();
        if (cursorPos >= 0 && cursorPos <= elemCount) {
          const cursor = {name: cursorName};
          if ('store' in decl.value) {
            const cursorPrevPos = decl.value.previous.toInteger();
            if (cursorPrevPos >= 0 && cursorPrevPos <= elemCount) {
              cursor.prev = cursorPrevPos;
            }
          }
          // Add cursor to position's cursors list.
          if (!(cursorPos in cursorMap)) {
            cursorMap[cursorPos] = {index: cursorPos, cursors: [], row: 0};
          }
          cursorMap[cursorPos].cursors.push(cursor);
          builder.addMarker(cursorPos, pointsByKind.cursor);
        }
      }
    });
    // Read the selected cells.
    const selection = builder.getSelection();
    const cells = readArray1D(core, type, ref.address, selection);
    // Build the array of displayed cursors, staggering them to minimize overlap.
    const cursors = [];
    let nextStaggerCol, cursorRow = 0;
    selection.forEach(function (index, col) {
      if (index in cursorMap) {
        const cursor = cursorMap[index];
        if (col === nextStaggerCol) {
          cursorRow = (cursorRow + 1) % cursorRows;
        } else {
          cursorRow = 0;
        }
        nextStaggerCol = col + 1;
        cursor.col = col;
        cursor.row = cursorRow;
        cursors.push(cursor);
      }
    });
    return {cells, cursors};
  };

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

  const drawGrid = function (cells) {
    const elements = [];
    // Horizontal lines
    const x1 = cells.length * cellWidth;
    const y1 = textLineHeight * 1, y2 = textLineHeight * 2;
    elements.push(<line key='h1' x1={0} x2={x1} y1={y1} y2={y1} stroke={gridStroke} strokeWidth={gridStrokeWidth} />);
    elements.push(<line key='h2' x1={0} x2={x1} y1={y2} y2={y2} stroke={gridStroke} strokeWidth={gridStrokeWidth} />);
    // Vertical lines
    for (let i = 0, x = 0; i <= cells.length; i += 1, x += cellWidth) {
      elements.push(<line key={`v${i}`} x1={x} x2={x} y1={y1} y2={y2} stroke={gridStroke} strokeWidth={gridStrokeWidth} />);
    }
    //  Column labels
    const y3 = baseline(2);
    for (let i = 0, x = 0; i < cells.length; i += 1, x += cellWidth) {
      elements.push(<text key={`l${i}`} x={x + cellWidth / 2} y={y3} textAnchor='middle' fill='#777'>{cells[i].index}</text>);
    }
    return <g>{elements}</g>;
  };

  const drawCell = function (cell) {
    const {position, index, address, content, ellipsis} = cell;
    const y0 = baseline(0);
    const y0a = y0 - (textLineHeight - textBaseline) / 3;
    const y1 = baseline(1);
    return (
      <g key={index} transform={`translate(${position * cellWidth},0)`} clipPath="url(#cell)">
        {content && 'previous' in content &&
          <g>
            <text x={cellWidth/2} y={y0} textAnchor="middle" fill="#777">
              {renderValue(content.previous)}
            </text>
            <line x1={2} x2={cellWidth-2} y1={y0a} y2={y0a} stroke="#777" strokeWidth="2"/>
          </g>}
        <text x={cellWidth/2} y={y1} textAnchor="middle">
          {content && renderValue(content.current)}
          {ellipsis && '…'}
        </text>
      </g>
    );
  };

  const drawCursor = function (cursor) {
    const {index, cursors, col, row} = cursor;
    const arrowTop = textLineHeight * 3;
    const arrowHeight = minArrowHeight + row * textLineHeight;
    const cursorsY = baseline(3) + arrowHeight;
    const fillColor = '#eef';
    return (
      <g key={index} transform={`translate(${col * cellWidth},0)`}>
        <polygon points={arrowPoints(cellWidth/2, arrowTop, 6, arrowHeight)}/>
        <text x={cellWidth/2} y={cursorsY} textAnchor="middle">
          {cursors.map(cursor => cursor.name).join(',')}
        </text>
        <rect x="0" y={textLineHeight} width={cellWidth} height={textLineHeight} fill={fillColor}/>
      </g>
    );
  };

  const onViewChange = function (event) {
    const {value} = event;
    // Prevent vertical panning.
    value.matrix.f = 0;
    const update = {viewState: value};
    self.props.onChange(self.props.directive, update);
  };

  const getViewState = function (controls) {
    const viewState = controls && controls.get('viewState');
    return viewState || ViewerHelper.getDefaultValue();
  };

  self.render = function () {
    const {controls} = self.props;
    const {error, cells, cursors} = extractView();
    if (error) {
      return <div className='clearfix'>{error}</div>;
    }
    const viewState = getViewState(self.props.controls);
    return (
      <div className='clearfix' style={{padding: '2px'}}>
        <div style={{width: '100%', height: cellHeight+'px'}}>
          <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
            <svg width={cellWidth * cells.length} height={cellHeight} version="1.1" xmlns="http://www.w3.org/2000/svg">
              <clipPath id="cell">
                <rect x="0" y="0" width={cellWidth} height={3 * textLineHeight} strokeWidth="5"/>
              </clipPath>
              <g style={{fontFamily: 'Open Sans', fontSize: '13px'}}>
                {cursors.map(drawCursor)}
                {cells.map(drawCell)}
                {drawGrid(cells)}
              </g>
            </svg>
          </ViewerResponsive>
        </div>
      </div>
    );
  };

});
