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
import * as C from 'persistent-c';

import {getNumber, getIdent, getList, arrowPoints, renderValue} from './utils';
import {getCursorMap, getCursors} from './array_utils';

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

const extractView = function (core, localMap, options) {
  const {memory, memoryLog, oldMemory} = core;
  const {columns} = options;
  const maxAddress = memory.size;
  let startAddress = Math.floor(options.startAddress);
  if (startAddress + columns >= maxAddress) {
    startAddress = maxAddress - columns;
  }
  let endAddress = startAddress + columns - 1;
  // Show 1 extra cell if address has a floating part.
  if (options.startAddress !== startAddress) {
    endAddress += 1;
  }
  const cells = [];
  const byteOps = []; // spare array of {load,store} objects
  for (let address = startAddress; address <= endAddress; address += 1) {
    const current = memory.get(address);
    const cell = {column: address, address, current};
    const ops = saveByteMemoryOps(byteOps, memoryLog, address);
    cell.load = ops.load;
    if (ops.store !== undefined) {
      cell.store = ops.store;
      cell.previous = oldMemory.get(address);
    }
    cells.push(cell);
  }
  // Build the cursor views.
  const cursorMap = getCursorMap(
    core, options.cursorNames, startAddress, endAddress, localMap);
  const cursors = getCursors(
    range(startAddress, endAddress), cursorMap, options.cursorRows);
  cursors.forEach(function (cursor) {
    // cursor.column = cursor.index - startAddress;
    cursor.column = cursor.index;
  });
  // Build the extra-type views.
  const extraRows = [];
  options.directNames.forEach(function (name) {
    if (localMap.has(name)) {
      const {type, ref} = localMap.get(name);
      if (type.kind === 'scalar' || type.kind === 'pointer') {
        extraRows.push(viewExtraCells(core, byteOps, ref, startAddress, endAddress));
      }
    }
  });
  return {cells, byteOps, cursors, extraRows};
};

/* Add to `byteOps` an object describing the latest the memory load/store
   operation in `memoryLog` for the byte at `address`.
   Ideally the representation of the memoryLog would allow a more efficient
   lookup.
 */
const saveByteMemoryOps = function (byteOps, memoryLog, address) {
  const ops = byteOps[address] = {};
  memoryLog.forEach(function (entry, i) {
    const ref = entry[1];
    const base = ref.address;
    if (base <= address) {
      const limit = ref.address + ref.type.pointee.size - 1;
      if (address <= limit) {
        ops[entry[0]] = i;
      }
    }
  });
  return ops;
};

const maxDefinedRank = function (r1, r2) {
  if (r1 === undefined)
    return r2;
  if (r2 ===  undefined)
    return r1;
  return Math.max(r1, r2);
};

const getByteRangeOps = function (byteOps, start, end) {
  let load, store;
  range(start, end).forEach(function (address) {
    const ops = byteOps[address];
    if (ops) {
      load = maxDefinedRank(load, ops.load);
      store = maxDefinedRank(store, ops.store);
    }
  });
  return {load, store};
};

const viewExtraCells = function (core, byteOps, ref, startAddress, endAddress) {
  const {memory, oldMemory} = core;
  const refType = ref.type;
  const {size} = refType.pointee;
  const alignment = ref.address % size;
  // Realign start address.
  startAddress -= startAddress % size - alignment;
  const cells = [];
  for (let address = startAddress; address + size - 1 <= endAddress; address += size) {
    const valRef = {...ref, address};
    const current = C.readValue(memory, valRef);
    const ops = getByteRangeOps(byteOps, address, address + size - 1);
    const cell = {address, current};
    cell.load = ops.load;
    if (ops.store !== undefined) {
      cell.store = ops.store;
      cell.previous = C.readValue(oldMemory, valRef);
    }
    cells.push(cell);
  }
  return {size, cells};
};

export const MemoryView = EpicComponent(self => {

  const textLineHeight = 18;
  const textBaseline = 5;
  const cellWidth = 32;
  const cellHeight = 2 * textLineHeight;
  const addressAngle = 60;
  const addressSize = rotate(addressAngle, 40, textLineHeight)
  const marginLeft = 10;
  const marginTop = 10;
  const cellTopPadding = 4;
  const nBytesShown = 32;
  const minArrowHeight = 20;
  const cursorRows = 2;

  const baseline = function (i) {
    return textLineHeight * (i + 1) - textBaseline;
  };

  const drawLabels = function (view) {
    const {cells} = view;
    const elements = [];
    const x0 = marginLeft;
    const y0 = view.layout.labelsTop + addressSize.y;
    const dx1 = cellWidth / 2 - addressSize.x / 2; // address label x offset
    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      const {column, address} = cell;
      const x1 = x0 + column * cellWidth;
      // Top and bottom horizontal lines.
      if (address !== undefined) {
        elements.push(
          <text key={address} transform={`translate(${x1+dx1},${y0}) rotate(${-addressAngle})`}>
            {formatAddress(address)}
          </text>
        );
      }
    }
    return <g className='labels'>{elements}</g>;
  };

  const drawGrid = function (view) {
    const {cells} = view;
    const elements = [];
    const x0 = marginLeft;
    const y0 = view.layout.bytesTop;
    const y1 = y0 + cellTopPadding;     // cell top border
    const y2 = y1 + textLineHeight * 2; // cell bottom border
    let x2;
    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      const {column} = cell;
      const x1 = x0 + column * cellWidth;
      // Vertical line on the left.
      elements.push(<line key={`v${i}`} x1={x1} x2={x1} y1={y1} y2={y2} className="v" />);
      x2 = x1 + cellWidth; // assume cells are contiguous
      // Top and bottom horizontal lines.
      const className = classnames(['h', cell.gap && 'gap']);
      elements.push(<line key={`ht${i}`} x1={x1} x2={x2} y1={y1} y2={y1} className={className} />);
      elements.push(<line key={`hb${i}`} x1={x1} x2={x2} y1={y2} y2={y2} className={className} />);
    }
    // Vertical line on the right of the last element.
    elements.push(<line key={`v${cells.length}`} x1={x2} x2={x2} y1={y1} y2={y2} className="v" />);
    return <g className='grid'>{elements}</g>;
  };

  const drawCell = function (cell) {
    if (cell.gap)
      return false;
    const {column, address} = cell;
    const x0 = marginLeft + column * cellWidth;
    const y0 = this.layout.bytesTop + cellTopPadding;
    return (
      <g className='cell' key={`0x${address}`} transform={`translate(${x0},${y0})`} clipPath='url(#cell)'>
        {drawCellContent(cell, 'byte', cellWidth, formatByte)}
      </g>
    );
  };

  const drawCellContent = function (cell, className, width, format) {
    const {current, load, store, previous} = cell;
    const x0 = width / 2;
    const y0 = baseline(0);
    const y1 = baseline(1);
    const h1 = (textLineHeight - textBaseline) / 3;
    const currentClasses = classnames(['current-value', load !== undefined && 'value-load']);
    return (
      <g className={className}>
        {store !== undefined &&
          <g className='previous-value'>
            <text x={x0} y={y0}>
              {format(previous)}
            </text>
            <line x1={2} x2={width - 2} y1={y0 - h1} y2={y0 - h1}/>
          </g>}
        <text x={x0} y={y1} className={currentClasses}>
          {format(current)}
        </text>
      </g>
    );
  };

  const drawCursor = function (cursor) {
    const {column, row, cursors} = cursor;
    const x0 = marginLeft + column * cellWidth;
    const y0 = this.layout.cursorsTop;
    const arrowHeight = minArrowHeight + (cursorRows - row - 1) * textLineHeight;
    const x1 = cellWidth / 2;
    const y1 = row * textLineHeight + textLineHeight - textBaseline;
    const y2 = cursorRows * textLineHeight + minArrowHeight;
    const fillColor = '#eef';
    const label = cursors.map(cursor => cursor.name).join(',');
    return (
      <g key={`c${column}`} transform={`translate(${x0},${y0})`} className='cursor'>
        <text x={x1} y={y1}>{label}</text>
        <polygon points={arrowPoints(cellWidth/2, y2, 6, -arrowHeight)}/>
      </g>
    );
  };

  const drawExtraRow = function (row, i) {
    const {size, cells} = row;
    const elements = [];
    const x0 = marginLeft;
    const y0 = this.layout.extraRowsTop + i * cellHeight + cellTopPadding;
    const width = size * cellWidth;
    cells.forEach(function (cell) {
      const {address} = cell;
      const x = x0 + address * cellWidth;
      // TODO: clip cell using clipPath='url(#extras`${i}`)'
      elements.push(
        <g className='cell' key={`0x${address}`} transform={`translate(${x},${y0})`}>
          {drawCellContent(cell, 'extra', width, renderValue)}
        </g>
      );
    });
    return <g className='extraRow'>{elements}</g>;
  };

  const onShiftLeft = function (event) {
    let startAddress = self.props.controls.get('startAddress', 0) - 32;
    startAddress = Math.max(0, startAddress);
    self.props.onChange(self.props.directive, {startAddress});
  };

  const onShiftRight = function (event) {
    let startAddress = self.props.controls.get('startAddress', 0) + 32;
    startAddress = Math.min(self.props.context.core.memory.size - nBytesShown, startAddress);
    self.props.onChange(self.props.directive, {startAddress});
  };

  const onSeek = function (startAddress) {
    const current = self.props.controls.get('startAddress', 0);
    // Clear the LSB.
    startAddress = startAddress ^ (startAddress & 0xFF);
    // Preserve the current 16-bit alignment.
    startAddress |= current & 0xF0;
    // Clip to valid range.
    startAddress = Math.max(0, startAddress);
    startAddress = Math.min(self.props.context.core.memory.size - nBytesShown, startAddress);
    self.props.onChange(self.props.directive, {startAddress});
  };

  const getStartAddress = function () {
    let address = self.props.controls.get('startAddress');
    if (address === undefined) {
      address = getNumber(self.props.directive.byName.start, 0);
    }
    return address;
  };

  const onViewChange = function (event) {
    const {mode, startX, startY, matrix} = event.value;
    const {directive, scale} = self.props;
    const maxAddress = self.props.context.core.memory.size - nBytesShown;
    const startAddress = Math.min(maxAddress, Math.max(0, -matrix.e / (cellWidth * scale)));
    const update = {mode, startX, startY, startAddress};
    self.props.onChange(directive, update);
  };

  const getViewState = function (startAddress) {
    const {scale, controls, directive} = self.props;
    const x = -startAddress * cellWidth * scale;
    return {
      matrix: {a: scale, b: 0, c: 0, d: scale, e: x, f: 0},
      mode: controls.get('mode', 'idle'),
      startX: controls.get('startX'),
      startY: controls.get('startY')
    };
  };

  self.render = function () {
    const {Frame, controls, directive, frames, context, scale} = self.props;
    const localMap = frames[0].get('localMap');
    const {core} = context;
    // Directive arguments
    //   - cursors: list of variable names (pointers) to display as cursors
    //   - vars: list of variable names (pointers or arrays) to display on
    //        additional lines
    //   - height: set view height in pixels
    const {byName, byPos} = directive;
    const directNames = getList(byName.direct, []).map(getIdent);
    const indirectNames = getList(byName.indirect, []).map(getIdent);
    const cursorNames = getList(byName.cursors, []).map(getIdent);
    const height = getNumber(byName.height, 'auto');
    // Controls
    //   - fullView: read and render all visible bytes
    const fullView = controls.get('fullView');
    const startAddress = getStartAddress();
    const viewState = getViewState(startAddress);
    // Extract the view-model.
    const maxAddress = self.props.context.core.memory.size;
    const view = extractView(
      core,
      localMap,
      {
        startAddress,
        columns: nBytesShown,
        cursorNames,
        cursorRows,
        directNames,
        indirectNames
      });
    const layout = view.layout = {};
    layout.cursorsHeight = cursorRows * textLineHeight + minArrowHeight;
    layout.labelsHeight = addressSize.y;
    layout.bytesHeight = cellHeight;
    layout.extraRowsHeight = (directNames.length + indirectNames.length) * cellHeight;
    layout.cursorsTop = marginTop;
    layout.labelsTop = layout.cursorsTop + layout.cursorsHeight;
    layout.bytesTop = layout.labelsTop + marginTop + layout.labelsHeight;
    layout.extraRowsTop = layout.bytesTop + layout.bytesHeight;
    layout.bottom = layout.extraRowsTop + layout.extraRowsHeight;
    const svgWidth = marginLeft + cellWidth * maxAddress;
    const svgHeight = layout.bottom;
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
                <g className='memory-view'>
                  {drawGrid(view)}
                  {drawLabels(view)}
                  <g className='cells'>{view.cells.map(drawCell.bind(view))}</g>
                  <g className='cursors'>{view.cursors.map(drawCursor.bind(view))}</g>
                  <g className='extraRows'>{view.extraRows.map(drawExtraRow.bind(view))}</g>
                </g>
              </svg>
            </ViewerResponsive>
          </div>
        </div>
      </Frame>
    );
  };

});
