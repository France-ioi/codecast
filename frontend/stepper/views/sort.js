
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';
import range from 'node-range';

import {getNumber, getList, viewExprs, evalExpr, renderValue, renderArrow} from './utils';
import {extractView} from './array_utils';

export const SortView = EpicComponent(self => {

  const marginLeft = 100;
  const marginTop = 4;
  const marginBottom = 4;
  const barWidth = 24;
  const barHeight = 100;
  const barSpacing = 4;
  const barPaddingBottom = 3;
  const barMarginBottom = 2;
  const thresholdMarginRight = 5;
  const thresholdLineExt = 3;
  const textLineHeight = 18;
  const textBaseline = 5;
  const minArrowHeight = 20;

  const getValueClass = function (content) {
    // TODO: rect depending on cell cursor/read/write
    return (
      'store' in content ? 'store' :
      'load' in content ? 'load' :
      'default');
  };

  const drawBar = function (cell) {
    const {position, index, address, content, gap} = cell;
    const w1 = barWidth + barSpacing;        // w1: total bar width
    const y1 = barHeight;                    // y1: relative bottom corner of bar rect
    const y5 = y1 + textLineHeight - textBaseline + barMarginBottom; // y5: baseline of the index label
    const x0 = marginLeft + w1 * position;   // x0: absolute left corner of bar
    const y0 = marginTop;                    // y0: absolute top corner of bar
    const x1 = barWidth / 2;                 // x1: relative horizontal center of text
    if (!content) {
      return (
        <g key={`C${index}`} className="bar" transform={`translate(${x0},${y0})`} clipPath="url(#barClipping)">
          {gap
            ? <text x={x1} y={y5} className="gap">{'…'}</text>
            : <text x={x1} y={y5} className="index">{index}</text>}
        </g>
      );
    }
    const rectClass = getValueClass(content);
    const y3 = y1 - textBaseline - barPaddingBottom;
    const y4 = y3 - textLineHeight;
    const h1 = barHeight * content.current.toInteger() / this.maxValue; // y3: bar height based on value
    const h2 = (textLineHeight - textBaseline) / 3 // strike-through height from line
    return (
      <g key={`C${index}`} className="bar" transform={`translate(${x0},${y0})`}>
        <rect className={rectClass} x="0" y={y1 - h1} width={barWidth} height={h1} />
        <text x={x1} y={y5} className="index">{index}</text>
        <g clipPath="url(#barClipping)">
          {'previous' in content &&
            <g className="previous-content">
              <text x={x1} y={y4}>
                {renderValue(content.previous)}
              </text>
              <line x1={2} x2={barWidth-2} y1={y4 - h2} y2={y4 - h2}/>
            </g>}
          <text x={x1} y={y3} className="current-content">{renderValue(content.current)}</text>
        </g>
      </g>
    );
  };

  const drawCursor = function (cursor) {
    const {index, labels, col, row} = cursor;
    const h1 = minArrowHeight + row * textLineHeight;
    const x0 = marginLeft + (barWidth + barSpacing) * col;
    const y0 = marginTop + barHeight + barMarginBottom + textLineHeight;
    const x1 = barWidth / 2;
    const y1 = h1 + textLineHeight - textBaseline;
    return (
      <g key={`c${index}`} className="cursor" transform={`translate(${x0},${y0})`}>
        {renderArrow(x1, 0, 'up', 6, h1)}
        <text x={x1} y={y1} className="names">
          {labels.join(',')}
        </text>
      </g>
    );
  };

  const drawThreshold = function (decl, i) {
    const {label, error, value} = decl;
    if (error || !('number' in value))
      return false;
    const x0 = marginLeft - thresholdLineExt;
    const x1 = marginLeft + (barWidth + barSpacing) * this.nbCells + thresholdLineExt;
    const x2 = marginLeft - thresholdMarginRight;
    const y0 = marginTop + barHeight * value.number / this.maxValue;
    const y1 = y0 + textBaseline;
    return (
      <g key={`t-${i}`} className="threshold">
        <line x1={x0} x2={x1} y1={y0} y2={y0}/>
        <text x={x2} y={y1}>{label}</text>
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
    const {Frame, controls, directive, frames, context, scale} = self.props;
    const {core} = context;
    const topFrame = frames[0];
    const localMap = topFrame.get('localMap');
    // Controls
    //   - fullView: read and render all cells
    const fullView = controls.get('fullView');
    const {byName, byPos} = directive;
    const expr = byPos[0];
    const {dim} = byName;
    const getOptions = {core: core, frame: topFrame};
    const thExprs = getList(byName.thresholds, []);
    const cursorExprs = getList(byName.cursors, []);
    const cursorRows = getNumber(byName.cursorRows, 1);
    const maxVisibleCells = getNumber(byName.n, 40);
    const height = getNumber(byName.height, 'auto');
    const view = {dimExpr: dim, fullView, cursorExprs, maxVisibleCells, cursorRows};
    Object.assign(view, extractView(context, topFrame, expr, view));
    if (view.error) {
      return <Frame {...self.props}>{view.error}</Frame>;
    }
    view.thresholds = viewExprs(core, topFrame, thExprs);
    view.nbCells = view.cells.length;
    const viewState = getViewState(controls);
    const svgWidth = marginLeft + (barWidth + barSpacing) * view.nbCells;
    const svgHeight = marginTop + barHeight + barMarginBottom + textLineHeight + minArrowHeight + textLineHeight * cursorRows + marginBottom;
    const divHeight = ((height === 'auto' ? svgHeight : height) * scale) + 'px';
    // Find the largest cell value.
    let maxValue = 0;
    view.cells.forEach(function (cell) {
      if (cell.content) {
        const {kind, current} = cell.content;
        if (kind === 'scalar' && 'number' in current) {
          const value = current.number;
          if (value > maxValue)
            maxValue = value;
        }
      }
    });
    view.maxValue = maxValue;
    return (
      <Frame {...self.props} hasFullView>
        <div className='clearfix' style={{padding: '2px'}}>
          <div style={{width: '100%', height: divHeight}}>
            <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
              <svg width={svgWidth} height={svgHeight} version="1.1" xmlns="http://www.w3.org/2000/svg">
                <clipPath id="barClipping">
                  <rect x="0" y="0" width={barWidth} height={barHeight}/>
                </clipPath>
                <g className="sort-view">
                  <g className="cursors">
                    {view.cursorMap.map(drawCursor.bind(view))}
                  </g>
                  <g className="cells">
                    {view.cells.map(drawBar.bind(view))}
                  </g>
                  <g className="thresholds">
                    {view.thresholds.map(drawThreshold.bind(view))}
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
