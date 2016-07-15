
import React from 'react';
import EpicComponent from 'epic-component';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';

import {getIdent, getList, viewVariable, readArray1D, renderValue} from './utils';

export const Array1D = EpicComponent(self => {

  // @11px, line height 15, offset 12
  const textLineHeight = 18;
  const textBaseline = 5; // from bottom
  const minArrowHeight = 20;
  const cellWidth = 28;
  const cursorRows = 2;
  const cellHeight = (3 + cursorRows) * textLineHeight + minArrowHeight;

  const extractView = function () {
    const {directive, controls, frames, context} = self.props;
    const {core} = context;
    // 'name' is the first positional argument
    const {byName, byPos} = directive;
    const cursors = getList(byName.cursors, []).map(getIdent);
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
    const cells = readArray1D(core, type, ref.address);
    // Inspect cursors.
    const elemCount = type.count;
    const cellInfoMap = [];
    cursors.forEach(function (cursorName) {
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
          if (!(cursorPos in cellInfoMap)) {
            cellInfoMap[cursorPos] = {};
          }
          const cellInfos = cellInfoMap[cursorPos];
          if (!('cursors' in cellInfos)) {
            cellInfos.cursors = [];
          }
          cellInfos.cursors.push(cursor);
        }
      }
    });
    // Stagger the displayed cursors.
    let nextStaggerPos, cursorRow = 0;
    for (let cursorPos in cellInfoMap) {
      // /!\ comparison between number and string
      if (nextStaggerPos == cursorPos) {
        cursorRow = (cursorRow + 1) % cursorRows;
      } else {
        cursorRow = 0;
      }
      nextStaggerPos = parseInt(cursorPos) + 1;
      cellInfoMap[cursorPos].cursorRow = cursorRow;
    }
    // Include an empty cell just past the end of the array.
    const tailCell = {
      index: type.count.toInteger(),
      address: ref.address + type.size
    };
    return {cells, tailCell, cellInfoMap};
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

  const renderColumn = function (cell, infos) {
    const {index, address, content} = cell;
    const y0 = baseline(0);
    const y0a = y0 - (textLineHeight - textBaseline) / 3;
    const y1 = baseline(1);
    const y2 = baseline(2);
    let cursorsY, arrowTop, arrowHeight, fillColor = 'transparent';
    if (infos && infos.cursors) {
      cursorsY = baseline(3 + infos.cursorRow) + minArrowHeight;
      arrowTop = textLineHeight * 3;
      arrowHeight = cursorsY - textLineHeight - y2;
      fillColor = '#eef';
    }
    return (
      <g key={index} transform={`translate(${index * cellWidth},0)`}>
        <g clipPath="url(#cell)">
          {content && 'store' in content && <g>
            <text x={cellWidth/2} y={y0} textAnchor="middle" fill="#777">
              {renderValue(content.previous)}
            </text>
            <line x1={2} x2={cellWidth-2} y1={y0a} y2={y0a} stroke="#777" strokeWidth="2"/>
          </g>}
          {content && <g>
            <rect x="0" y={textLineHeight} width={cellWidth} height={textLineHeight} stroke="black" fill={fillColor} strokeWidth="1"/>
            <text x={cellWidth/2} y={y1} textAnchor="middle">
              {renderValue(content.current)}
            </text>
          </g>}
          <text x={cellWidth/2} y={y2} textAnchor="middle" fill="#777">{index}</text>
        </g>
        {infos &&
          <g>
            <polygon points={arrowPoints(cellWidth/2, arrowTop, 6, arrowHeight)}/>
            <text x={cellWidth/2} y={cursorsY} textAnchor="middle">
              {infos.cursors.map(cursor => cursor.name).join(',')}
            </text>
          </g>}
      </g>
    );
  };

  const onViewChange = function (event) {
    const {value} = event;
    const update = {viewState: value};
    self.props.onChange(self.props.directive, update);
  };

  const getViewState = function (controls) {
    const viewState = controls && controls.get('viewState');
    return viewState || ViewerHelper.getDefaultValue();
  };

  self.render = function () {
    const {controls} = self.props;
    const {error, cells, tailCell, cellInfoMap} = extractView();
    if (error) {
      return <div className='clearfix'>{error}</div>;
    }
    const viewState = getViewState(self.props.controls);
    return (
      <div className='clearfix' style={{padding: '2px'}}>
        <div style={{width: '100%', height: cellHeight+'px'}}>
          <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
            <svg width={cellWidth * tailCell.index} height={cellHeight} version="1.1" xmlns="http://www.w3.org/2000/svg">
              <clipPath id="cell">
                  <rect x="0" y="0" width={cellWidth} height={3 * textLineHeight} strokeWidth="5"/>
              </clipPath>
              <g style={{fontFamily: 'Open Sans', fontSize: '13px'}}>
                {cells.map(cell => renderColumn(cell, cellInfoMap[cell.index]))}
                {tailCell && renderColumn(tailCell, cellInfoMap[tailCell.index])}
              </g>
            </svg>
          </ViewerResponsive>
        </div>
      </div>
    );
  };

});
