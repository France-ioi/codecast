
import React from 'react';
import EpicComponent from 'epic-component';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';

import {getIdent, getList, viewVariable, readArray2D, renderValue} from './utils';

export const Array2D = EpicComponent(self => {

  const textLineHeight = 17;
  const textBaseline = 5; // from bottom
  const strikeThroughHeight = 5; // from baseline
  const cellWidth = 50;
  const cellHeight = 2 * textLineHeight + 3;
  const gridLeft = 50;
  const gridTop = 50;
  const gridStroke = "#777";
  const gridStrokeWidth = "3";

  const extractView = function () {
    const {directive, controls, frames, context} = self.props;
    const {core} = context;
    // Positional arguments: [varName]
    // Named arguments: {rowCursor, colCursors}
    const {byName, byPos} = directive;
    const varName = getIdent(byPos[0]);
    const rowCursors = getList(byName.rowCursors, []).map(getIdent);
    const colCursors = getList(byName.colCursors, []).map(getIdent);
    // Look for the variable in the topmost frame.
    // TODO: look in globals if frames.length === 0
    const frame = frames[0];
    const localMap = frame.get('localMap');
    if (!localMap.has(varName)) {
      return {error: <p>{varName}{" not in scope"}</p>};
    }
    const {type, ref} = localMap.get(varName);
    // Expect an array of array declaration.
    if (type.kind !== 'array' || type.elem.kind !== 'array') {
      return {error: <p>{"value is not a 2D array"}</p>};
    }
    const rows = readArray2D(core, type, ref.address);
    // Inspect cursors.
    const rowCount = type.count, colCount = type.elem.count;
    const rowInfoMap = [], colInfoMap = [];
    rowCursors.forEach(cursorName =>
      readCursor(cursorName, rowCount, localMap, core, rowInfoMap));
    colCursors.forEach(cursorName =>
      readCursor(cursorName, colCount, localMap, core, colInfoMap));
    return {rows, rowCount, colCount, rowInfoMap, colInfoMap};
  };

  const readCursor = function (cursorName, elemCount, localMap, core, infoMap) {
    if (!localMap.has(cursorName)) {
      return;
    }
    const {type, ref} = localMap.get(cursorName);
    const decl = viewVariable(core, cursorName, type, ref.address);
    const cursorPos = decl.value.current.toInteger();
    if (cursorPos < 0 || cursorPos > elemCount) {
      return;
    }
    const cursor = {name: cursorName};
    if ('store' in decl.value) {
      const cursorPrevPos = decl.value.previous.toInteger();
      if (cursorPrevPos >= 0 && cursorPrevPos <= elemCount) {
        cursor.prev = cursorPrevPos;
      }
    }
    if (!(cursorPos in infoMap)) {
      infoMap[cursorPos] = {};
    }
    const infos = infoMap[cursorPos];
    if (!('cursors' in infos)) {
      infos.cursors = [];
    }
    infos.cursors.push(cursor);
  };

  const drawCell = function (view, rowIndex, cell) {
    const colIndex = cell.index;
    const {content} = cell;
    const x = gridLeft + (colIndex + 0.5) * cellWidth;
    const y1 = gridTop + rowIndex * cellHeight + textLineHeight * 1 - textBaseline;
    const y1a = y1 - strikeThroughHeight;
    const y2 = gridTop + rowIndex * cellHeight + textLineHeight * 2 - textBaseline;
    return (
      <g>
        {content && 'store' in content && <g>
          <text x={x} y={y1} textAnchor="middle" fill="#777">
            {renderValue(content.previous)}
          </text>
          <line x1={x - cellWidth / 2 + 5} x2={x + cellWidth / 2 - 5} y1={y1a} y2={y1a} stroke="#777" strokeWidth="2"/>
        </g>}
        <text x={x} y={y2} textAnchor="middle" fill="#000">
          {renderValue(content.current)}
        </text>
      </g>
    );
  };

  const drawRow = function (view, row) {
    return (
      <g>
        {row.content.map(cell => drawCell(view, row.index, cell))}
      </g>
    );
  };

  const drawGrid = function (rowCount, colCount) {
    const lines = [];
    const x1 = gridLeft, x2 = x1 + colCount * cellWidth;
    for (let i = 0, y = gridTop; i <= rowCount; i += 1, y += cellHeight) {
      lines.push(<line x1={x1} x2={x2} y1={y} y2={y} stroke={gridStroke} strokeWidth={gridStrokeWidth} />);
    }
    const y1 = gridTop, y2 = y1 + rowCount * cellHeight;
    for (let j = 0, x = gridLeft; j <= colCount; j += 1, x += cellWidth) {
      lines.push(<line x1={x} x2={x} y1={y1} y2={y2} stroke={gridStroke} strokeWidth={gridStrokeWidth} />);
    }
    return <g>{lines}</g>;
  };

  const onViewChange = function (event) {
    const update = {viewState: event.value};
    self.props.onChange(self.props.directive, update);
  };

  const getViewState = function () {
    const {controls} = self.props;
    const viewState = controls && controls.get('viewState');
    return viewState || ViewerHelper.getDefaultValue();
  };

  self.render = function () {
    const view = extractView();
    if (view.error) {
      return <div className='clearfix'>{view.error}</div>;
    }
    const {rows, rowCount, colCount} = view;
    const height = gridTop + rowCount * cellHeight;
    const width = gridLeft + colCount * cellWidth;
    const viewState = getViewState();
    return (
      <div className='clearfix' style={{padding: '2px'}}>
        <div style={{width: '100%', height: '200px'}}>
          <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
            <svg width={width} height={height} version="1.1" xmlns="http://www.w3.org/2000/svg">
              <clipPath id="cell">
                  <rect x="0" y="0" width={cellWidth} height={cellHeight} strokeWidth="5"/>
              </clipPath>
              {drawGrid(rowCount, colCount)}
              <text x={10} y={textLineHeight * 1 - textBaseline} textAnchor="right" fill="#777">row labels and cursors</text>
              <text x={10} y={textLineHeight * 2 - textBaseline} textAnchor="right" fill="#777">col labels and cursors</text>
              {rows.map(row => drawRow(view, row))}
            </svg>
          </ViewerResponsive>
        </div>
      </div>
    );
  };

});
