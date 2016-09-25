
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';
import range from 'node-range';

import {getIdent, getNumber, getList, renderValue, renderArrow} from './utils';
import {extractView} from './array_utils';

export const Array1D = EpicComponent(self => {

  // @11px, line height 15, offset 12
  const textLineHeight = 18;
  const textBaseline = 5; // from bottom
  const arrowWidth = 6;
  const minArrowHeight = 20;
  const cursorRows = 2;
  const cellHeight = (3 + cursorRows) * textLineHeight + minArrowHeight;

  const baseline = function (i) {
    return textLineHeight * (i + 1) - textBaseline;
  };

  const getCellClasses = function (cell, cursor) {
    const {content} = cell;
    if (content) {
      if ('store' in content)
        return "cell cell-store";
      if ('load' in content)
        return "cell cell-load";
    }
    if (cursor)
      return "cell cell-cursor";
    return "cell";
  };

  const drawGrid = function (view) {
    const {cells, cursorMap, cellWidth} = view;
    const elements = [];
    // Column labels and horizontal lines
    const y1 = textLineHeight * 1;
    const y2 = textLineHeight * 2;
    const y3 = baseline(2);
    for (let i = 0, x = 0; i < cells.length; i += 1, x += cellWidth) {
      const cell = cells[i];
      const cursor = cursorMap[cell.index];
      const hLineCls = classnames(['h', cell.gap && 'gap']);
      const cellClasses = getCellClasses(cell, cursor);
      elements.push(
        <g key={`h${i}`}>
          <text x={x + cellWidth / 2} y={y3} className="index">{cell.index}</text>
          <rect x={x} y={y1} width={cellWidth} height={textLineHeight} className={cellClasses}/>
          <line x1={x} x2={x + cellWidth} y1={y1} y2={y1} className={hLineCls} className="t" />
          <line x1={x} x2={x + cellWidth} y1={y2} y2={y2} className={hLineCls} className="b" />
        </g>
      );
    }
    // Vertical lines
    for (let i = 0, x = 0; i <= cells.length; i += 1, x += cellWidth) {
      elements.push(<line key={`v${i}`} x1={x} x2={x} y1={y1} y2={y2} className="v" />);
    }
    return <g className="grid">{elements}</g>;
  };

  const drawCell = function (cell, i) {
    if (cell.gap) {
      return;
    }
    const {cellWidth} = this;
    const {position, index, address, content} = cell;
    const y0 = baseline(0);
    const y0a = y0 - (textLineHeight - textBaseline) / 3;
    const y1 = baseline(1);
    return (
      <g key={`C${index}`} transform={`translate(${position * cellWidth},0)`} clipPath="url(#cell)">
        {content && 'previous' in content &&
          <g className="previous-content">
            <text x={cellWidth/2} y={y0}>
              {renderValue(content.previous)}
            </text>
            <line x1={2} x2={cellWidth-2} y1={y0a} y2={y0a}/>
          </g>}
        <text x={cellWidth/2} y={y1} className="current-content">
          {content && renderValue(content.current)}
        </text>
      </g>
    );
  };

  const drawCursor = function (cursor) {
    const {cellWidth} = this;
    const {index, labels, col, row} = cursor;
    const arrowTop = textLineHeight * 3;
    const arrowHeight = minArrowHeight + row * textLineHeight;
    const cursorsY = baseline(3) + arrowHeight;
    return (
      <g key={`c${index}`} transform={`translate(${col * cellWidth},0)`}>
        {renderArrow(cellWidth / 2, arrowTop, 'up', arrowWidth, arrowHeight)}
        <text x={cellWidth/2} y={cursorsY}>
          {labels.join(',')}
        </text>
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
    const viewState = controls.get('viewState');
    return viewState || ViewerHelper.getDefaultValue();
  };

  self.render = function () {
    const {Frame, controls, directive, frames, context} = self.props;
    const topFrame = frames[0];
    const fullView = controls.get('fullView');
    const {byName, byPos} = directive;
    const expr = byPos[0];
    const cursorExprs = getList(byName.cursors, []);
    const cellWidth = getNumber(byName.cw, 28);
    const maxVisibleCells = getNumber(byName.n, 40);
    const {dim} = byName;
    // The first element of `frames` is the topmost frame containing the
    // directive.
    const view = {dimExpr: dim, fullView, cursorExprs, cellWidth, maxVisibleCells};
    Object.assign(view, extractView(context.core, topFrame, expr, view));
    if (view.error) {
      return <Frame {...self.props}>{view.error}</Frame>;
    }
    const viewState = getViewState(controls)
    return (
      <Frame {...self.props} hasFullView>
        <div className='clearfix' style={{padding: '2px'}}>
          <div style={{width: '100%', height: cellHeight+'px'}}>
            <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
              <svg width={cellWidth * view.cells.length} height={cellHeight} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <clipPath id="cell">
                  <rect x="0" y="0" width={cellWidth} height={3 * textLineHeight}/>
                </clipPath>
                <g className="array1d">
                  {drawGrid(view)}
                  <g className="cursors">
                    {view.cursorMap.map(drawCursor.bind(view))}
                  </g>
                  <g className="cells">
                    {view.cells.map(drawCell.bind(view))}
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
