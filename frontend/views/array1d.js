
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';
import range from 'node-range';

import {getIdent, getNumber, getList, renderValue} from './utils';
import {extractView} from './array_utils';

export const Array1D = EpicComponent(self => {

  // @11px, line height 15, offset 12
  const textLineHeight = 18;
  const textBaseline = 5; // from bottom
  const minArrowHeight = 20;
  const cursorRows = 2;
  const cellWidth = 28;
  const cellHeight = (3 + cursorRows) * textLineHeight + minArrowHeight;

  const baseline = function (i) {
    return textLineHeight * (i + 1) - textBaseline;
  };

  const arrowPoints = function (x0, y0, width, height) {
    const dx1 = width;
    const dx2 = width / 5;
    const dy1 = height / 3;
    const dy2 = height;
    return `${x0},${y0} ${x0-dx1},${y0+dy1} ${x0-dx2},${y0+dy1} ${x0-dx2},${y0+dy2} ${x0+dx2},${y0+dy2} ${x0+dx2},${y0+dy1} ${x0+dx1},${y0+dy1} ${x0},${y0}`;
  };

  const drawGrid = function (cells) {
    const elements = [];
    // Column labels and horizontal lines
    const y1 = textLineHeight * 1;
    const y2 = textLineHeight * 2;
    const y3 = baseline(2);
    for (let i = 0, x = 0; i < cells.length; i += 1, x += cellWidth) {
      const cell = cells[i];
      const className = classnames(['h', cell.gap && 'gap']);
      elements.push(<text key={`l${i}`} x={x + cellWidth / 2} y={y3} className="index">{cell.index}</text>);
      elements.push(<line key={`ht${i}`} x1={x} x2={x + cellWidth} y1={y1} y2={y1} className={className} />);
      elements.push(<line key={`hb${i}`} x1={x} x2={x + cellWidth} y1={y2} y2={y2} className={className} />);
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
    const {index, cursors, col, row} = cursor;
    const arrowTop = textLineHeight * 3;
    const arrowHeight = minArrowHeight + row * textLineHeight;
    const cursorsY = baseline(3) + arrowHeight;
    const fillColor = '#eef';
    return (
      <g key={`c${index}`} transform={`translate(${col * cellWidth},0)`}>
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
    const viewState = controls.get('viewState');
    return viewState || ViewerHelper.getDefaultValue();
  };

  self.render = function () {
    const {Frame, controls, directive, frames, context} = self.props;
    const fullView = controls.get('fullView');
    const {byName, byPos} = directive;
    const name = getIdent(byPos[0]);
    const cursorNames = getList(byName.cursors, []).map(getIdent);
    const maxVisibleCells = getNumber(byName.n, 40);
    // The first element of `frames` is the topmost frame containing the
    // directive.
    const {error, cells, cursors} = extractView(
      context.core, frames[0], name,
      {fullView, cursorNames, maxVisibleCells});
    if (error) {
      return <Frame {...self.props}>{error}</Frame>;
    }
    const viewState = getViewState(controls);
    return (
      <Frame {...self.props} hasFullView>
        <div className='clearfix' style={{padding: '2px'}}>
          <div style={{width: '100%', height: cellHeight+'px'}}>
            <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
              <svg width={cellWidth * cells.length} height={cellHeight} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <clipPath id="cell">
                  <rect x="0" y="0" width={cellWidth} height={3 * textLineHeight}/>
                </clipPath>
                <g className="array1d">
                  {cursors.map(drawCursor)}
                  {cells.map(drawCell)}
                  {drawGrid(cells)}
                </g>
              </svg>
            </ViewerResponsive>
          </div>
        </div>
      </Frame>
    );
  };

});
