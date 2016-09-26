
import React from 'react';
import EpicComponent from 'epic-component';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';

import {extractView} from './array2d_model';
import {getNumber, getList, renderValue, renderArrow} from './utils';

export const Array2D = EpicComponent(self => {

  const textLineHeight = 18;
  const textBaseline = 5; // from bottom
  const strikeThroughHeight = 5; // from baseline
  const textArrowHeight = 4; // from baseline to arrow point
  const textArrowSpacing = 2;
  const arrowHeadSize = 6;
  const arrowTailSize = 15;
  const cellWidth = 60;  // to fit a negative double
  const cellHeight = 2 * textLineHeight + 3;
  const gridLeft = textLineHeight * 4 + arrowTailSize;
  const gridTop = textLineHeight * 4 + arrowTailSize;
  const gridBorderLeft = 5;
  const gridBorderTop = 5;
  const gridStroke = "#777";
  const gridStrokeWidth = "1";
  const colNumWidth = 20;
  const colCursorRows = 2;

  // left offset: big enough to fit a cursor with 10 characters
  // top offset: 2 line (cursors) + arrow + 1 line (column index)
  // directive named argument to set view height

  const drawCells = function (view) {
    const {rows, rowCount, colCount, rowInfoMap, colInfoMap} = view;
    const elements = [];
    rows.forEach(function (row, i) {
      const rowIndex = row.index;
      const y1 = textLineHeight * 1 - textBaseline;
      const y1a = y1 - strikeThroughHeight;
      const y2 = textLineHeight * 2 - textBaseline;
      row.content.forEach(function (cell, j) {
        const colIndex = cell.index;
        const {content} = cell;
        const x = 0.5 * cellWidth;
        elements.push(
          <g transform={`translate(${colIndex * cellWidth},${rowIndex * cellHeight})`} clipPath="url(#cell)">
            {content && 'store' in content && <g>
              <text x={x} y={y1} textAnchor="middle" fill="#777">
                {renderValue(content.previous)}
              </text>
              <line x1={5} x2={cellWidth - 5} y1={y1a} y2={y1a} stroke="#777" strokeWidth="1"/>
            </g>}
            <text x={x} y={y2} textAnchor="middle" fill="#000">
              {renderValue(content.current)}
            </text>
          </g>
        );
      });
    });
    return <g transform={`translate(${gridLeft},${gridTop})`}>{elements}</g>;
  };

  const getCellClasses = function (content, rowCursor, colCursor) {
    if (content) {
      if (content.store !== undefined)
        return "cell cell-store";
      if (content.load !== undefined)
        return "cell cell-load";
    }
    if (rowCursor || colCursor)
      return "cell cell-cursor";
    return "cell";
  };

  const drawGrid = function (view) {
    const {rowCount, colCount, rows, rowInfoMap, colInfoMap} = view;
    const elements = [];
    // Cell backgrounds
    for (let i = 0; i <= rowCount; i += 1) {
      const row = rows[i] && rows[i].content;
      for (let j = 0; j <= colCount; j += 1) {
        const x1 = gridLeft + j * cellWidth;
        const y1 = gridTop + i * cellHeight;
        const cell = row && row[j] && row[j].content;
        const classes = getCellClasses(cell, rowInfoMap[i], colInfoMap[j]);
        elements.push(<rect x={x1} y={y1} width={cellWidth} height={cellHeight} className={classes}/>);
      }
    }
    // Horizontal lines
    const x1 = gridLeft, x2 = x1 + colCount * cellWidth;
    for (let i = 0, y = gridTop; i <= rowCount; i += 1, y += cellHeight) {
      elements.push(<line x1={x1} x2={x2} y1={y} y2={y} stroke={gridStroke} strokeWidth={gridStrokeWidth} />);
    }
    // Vertical lines
    const y1 = gridTop, y2 = y1 + rowCount * cellHeight;
    for (let j = 0, x = gridLeft; j <= colCount; j += 1, x += cellWidth) {
      elements.push(<line x1={x} x2={x} y1={y1} y2={y2} stroke={gridStroke} strokeWidth={gridStrokeWidth} />);
    }
    // Row labels
    let y = gridTop + (cellHeight + textLineHeight) / 2 - textBaseline;
    let x = gridLeft - gridBorderLeft;
    for (let i = 0; i < rowCount; i += 1, y += cellHeight) {
      elements.push(
        <text x={x} y={y} textAnchor="end" fill="#777">{i}</text>
      );
    }
    // Column labels
    x = gridLeft + cellWidth / 2;
    y = gridTop - gridBorderTop - textBaseline;
    for (let i = 0; i < rowCount; i += 1, x += cellWidth) {
      elements.push(
        <text x={x} y={y} textAnchor='middle' fill='#777'>{i}</text>
      );
    }
    return <g className="grid">{elements}</g>;
  };

  const drawRowCursors = function (rowCount, colCount, infoMap) {
    const elements = [];
    const x0 = gridLeft;
    const x1 = - gridBorderLeft - (textArrowSpacing + arrowTailSize);
    const x2 = x1 - colNumWidth;
    const y1 = (cellHeight + textLineHeight) / 2 - textBaseline;
    const y2 = y1 - textArrowHeight;
    for (let i in infoMap) {
      const cursor = infoMap[i];
      const y0 = gridTop + cellHeight * cursor.index;
      const label = cursor.labels.join(',');
      elements.push(renderArrow(x0 + x1, y0 + y2, 'right', arrowHeadSize, arrowTailSize));
      elements.push(<text x={x0 + x2} y={y0 + y1}>{label}</text>);
    }
    return <g className='row-cursors'>{elements}</g>;
  };

  const drawColCursors = function (colCount, rowCount, infoMap) {
    const elements = [];
    const y0 = gridTop;
    const x1 = cellWidth / 2;
    const y1 = - gridBorderTop - textLineHeight - textBaseline;
    const y2 = y1 - (textBaseline + textArrowSpacing + arrowTailSize);
    for (let j in infoMap) {
      const cursor = infoMap[j];
      const x0 = gridLeft + cellWidth * cursor.index;
      const label = cursor.labels.join(',');
      const y3 = cursor.row * textLineHeight;
      elements.push(renderArrow(x0 + x1, y0 + y1, 'down', arrowHeadSize, arrowTailSize + y3));
      elements.push(<text x={x0 + x1} y={y0 + y2 - y3}>{label}</text>);
    }
    return <g className='col-cursors'>{elements}</g>;
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
    const {Frame, scale, directive, frames, context} = self.props;
    // Positional arguments: [varName]
    // Named arguments: {rowCursor, colCursors, height}
    const {byName, byPos} = directive;
    const expr = byPos[0];
    const rowCursors = getList(byName.rowCursors, []);
    const colCursors = getList(byName.colCursors, []);
    const height = getNumber(byName.height, 'auto');
    const view = {rowCursors, colCursors, height};
    Object.assign(view, extractView(context.core, frames[0], expr, view));
    if (view.error) {
      return (
        <Frame {...self.props}>
          <div className='clearfix'>{view.error}</div>
        </Frame>);
    }
    const {rowCount, colCount, rowInfoMap, colInfoMap} = view;
    const svgHeight = gridTop + (rowCount + 1) * cellHeight;
    const svgWidth = gridLeft + (colCount + 1) * cellWidth;
    const divHeight = ((height === 'auto' ? svgHeight : height) * scale) + 'px';
    const viewState = getViewState();
    return (
      <Frame {...self.props}>
        <div className='clearfix' style={{padding: '2px'}}>
          <div style={{width: '100%', height: divHeight}}>
            <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
              <svg width={svgWidth} height={svgHeight} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <g transform={`scale(${scale})`} className="array2d">
                  <clipPath id="cell">
                    <rect x="0" y="0" width={cellWidth} height={cellHeight}/>
                  </clipPath>
                  <g style={{fontFamily: 'Open Sans', fontSize: '13px'}}>
                    {drawGrid(view, rowCount, colCount)}
                    {drawRowCursors(rowCount, colCount, rowInfoMap)}
                    {drawColCursors(colCount, rowCount, colInfoMap)}
                    {drawCells(view)}
                  </g>
                </g>
              </svg>
            </ViewerResponsive>
          </div>
        </div>
      </Frame>
    );
  };

});
