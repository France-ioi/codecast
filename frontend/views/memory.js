/*

Memory view directive.

# View-model description

The cells property of the view-model contains an array of cell objects.
Each cell has a 'column' property giving its column number (equal to its index
in the cells array).
A cell with a 'gap' property represents a gap in a sequence of
addresses.
A cell with an 'address' property represents a byte-size memory location,
and has these additional properties:
  - current: current byte content;
  - load: rank of latest load operation in memory log, if present;
  - store: rank of latest store operation in memory log, if present;
  - previous: previous byte content, if present.

*/

import React from 'react';
import EpicComponent from 'epic-component';
import Slider from 'rc-slider';
import {Button} from 'react-bootstrap';
import classnames from 'classnames';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';
import range from 'node-range';

import {getNumber, getIdent, getList} from './utils';

const rotate = function (a, x, y) {
  const a1 = a * Math.PI / 180;
  const sa = Math.sin(a1);
  const ca = Math.cos(a1);
  return {x: x * ca - y * sa, y: x * sa + y * ca};
};

const formatAddress = function (address) {
  return (address | 0x10000).toString(16).substring(1).toUpperCase();
};

const formatByte = function (byte) {
  return (byte | 0x100).toString(16).substring(1).toUpperCase();
};

const extractView = function (core, options) {
  const {memory} = core;
  const {columns} = options;
  const maxAddress = memory.size;
  let startAddress = options.startAddress;
  if (startAddress + columns >= maxAddress) {
    startAddress = maxAddress - columns;
  }
  const cells = [];
  for (let column = 0; column < columns; column += 1) {
    const address = startAddress + column;
    const current = memory.get(address);
    cells.push({column, address, current});
  }
  // {column: 0, address: 0, current: 0x00},
  // {column: 8, gap: true},
  // {column: 12, address: 65532, current: 0x01, load: 0, store: 1, previous: 0x00},
  return {cells};
};

export const MemoryView = EpicComponent(self => {

  const textLineHeight = 18;
  const textBaseline = 5;
  const cellWidth = 32;
  const cellHeight = 2 * textLineHeight;
  const addressAngle = 60;
  const addressSize = rotate(addressAngle, 40, textLineHeight)
  const marginLeft = 10;
  const marginTop = 10 + addressSize.y;
  const cellTopPadding = 4;

  const baseline = function (i) {
    return textLineHeight * (i + 1) - textBaseline;
  };

  const drawGrid = function (cells) {
    const elements = [];
    // Addresses and horizontal lines
    const x0 = marginLeft;
    const y0 = marginTop;
    const dx1 = cellWidth / 2 - addressSize.x / 2; // address label x offset
    const y1 = y0 + cellTopPadding;     // cell top border
    const y2 = y1 + textLineHeight * 2; // cell bottom border
    for (let i = 0, x = x0; i < cells.length; i += 1, x += cellWidth) {
      const cell = cells[i];
      const {column, address} = cell;
      const className = classnames(['h', cell.gap && 'gap']);
      elements.push(<line key={`ht${i}`} x1={x} x2={x + cellWidth} y1={y1} y2={y1} className={className} />);
      elements.push(<line key={`hb${i}`} x1={x} x2={x + cellWidth} y1={y2} y2={y2} className={className} />);
      if (address !== undefined) {
        elements.push(
          <text key={address} transform={`translate(${x + dx1},${y0}) rotate(${-addressAngle})`}>
            {formatAddress(address)}
          </text>
        );
      }
    }
    // Vertical lines
    for (let i = 0, x = x0; i <= cells.length; i += 1, x += cellWidth) {
      elements.push(<line key={`v${i}`} x1={x} x2={x} y1={y1} y2={y2} className="v" />);
    }
    return <g className='grid'>{elements}</g>;
  };

  const drawCell = function (cell, i) {
    if (cell.gap)
      return false;
    const x0 = cellWidth / 2;
    const y1 = baseline(1);
    const {column, index, current, load, store, previous} = cell;
    const y0 = baseline(0);
    const h1 = (textLineHeight - textBaseline) / 3;
    return (
      <g className='byte'>
        {typeof store === 'number' &&
          <g className='previous-value'>
            <text x={x0} y={y0}>
              {formatByte(previous)}
            </text>
            <line x1={2} x2={cellWidth-2} y1={y0-h1} y2={y0-h1}/>
          </g>}
        <text x={x0} y={y1} className='current-value'>
          {formatByte(current)}
        </text>
      </g>
    );
  };

  const getViewState = function (controls) {
    const viewState = controls.get('viewState');
    return viewState || ViewerHelper.getDefaultValue();
  };

  const onShiftLeft = function (event) {
    let startAddress = self.props.controls.get('startAddress', 0);
    startAddress = Math.max(0, startAddress - 32);
    self.props.onChange(self.props.directive, {startAddress});
  };

  const onShiftRight = function (event) {
    let startAddress = self.props.controls.get('startAddress', 0);
    startAddress = Math.min(self.props.context.core.memory.size - 1, startAddress + 32);
    self.props.onChange(self.props.directive, {startAddress});
  };

  const onSeek = function (startAddress) {
    const current = self.props.controls.get('startAddress', 0);
    // Clear the LSB.
    startAddress = startAddress ^ (startAddress & 0xFF);
    // Preserve the current 16-bit alignment.
    startAddress |= current & 0xF0;
    self.props.onChange(self.props.directive, {startAddress});
  };

  const onViewChange = function (event) {
    const {value} = event;
    // Prevent vertical panning.
    value.matrix.f = 0;
    const update = {viewState: value};
    self.props.onChange(self.props.directive, update);
  };

  self.render = function () {
    const {Frame, controls, directive, frames, context, scale} = self.props;
    const {core} = context;
    // Controls
    //   - fullView: read and render all visible bytes
    const fullView = controls.get('fullView');
    const viewState = getViewState(controls);
    const startAddress = controls.get('startAddress', 0);
    const maxAddress = self.props.context.core.memory.size;
    // Directive arguments
    //   - a: list of variable names (pointers) to display as cursors
    //   - b: list of variable names (pointers or arrays) to display on
    //        additional lines
    //   - height: set view height in pixels
    const {byName, byPos} = directive;
    const a = getList(byName.thresholds, []).map(getIdent);
    const b = getList(byName.cursors, []).map(getIdent);
    const height = getNumber(byName.height, 'auto');
    // Extract the view-model.
    const {cells} = extractView(core, {startAddress, columns: 32});
    const nbCells = cells.length;
    const svgWidth = marginLeft + cellWidth * nbCells;
    const svgHeight = marginTop + cellTopPadding + cellHeight;
    const divHeight = ((height === 'auto' ? svgHeight : height) * scale) + 'px';
    return (
      <Frame {...self.props} hasFullView>
        <div className="memory-controls directive-controls">
          <p className="start-address"><tt>{formatAddress(startAddress)}</tt></p>
          <div className="memory-slider-container" style={{width: '400px'}}>
            <Slider prefixCls="memory-slider" tipFormatter={null} value={startAddress} min={0} max={maxAddress} onChange={onSeek}>
              <div className="memory-slider-background"/>
            </Slider>
          </div>
          <Button onClick={onShiftLeft} title="shift view to the left">
            <i className="fa fa-arrow-left"/>
          </Button>
          <Button onClick={onShiftRight} title="shift view to the right">
            <i className="fa fa-arrow-right"/>
          </Button>
        </div>
        <div className='clearfix' style={{padding: '2px'}}>
          <div style={{width: '100%', height: divHeight}}>
            <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
              <svg width={svgWidth} height={svgHeight} version='1.1' xmlns='http://www.w3.org/2000/svg'>
                <g className="memory-view">
                  {drawGrid(cells)}
                  <g className='cells'>
                    {cells.map(function (cell) {
                      const {column, address} = cell;
                      const x0 = marginLeft + column * cellWidth;
                      const y0 = marginTop + cellTopPadding;
                      return (
                        <g className='cell' key={`0x${address}`} transform={`translate(${x0},${y0})`} clipPath='url(#cell)'>
                          {drawCell(cell)}
                        </g>
                      );
                    })}
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
