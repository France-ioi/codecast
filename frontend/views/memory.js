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

Document:
- bytes
- variables
- extras
- cursors

*/

import React from 'react';
import EpicComponent from 'epic-component';
import Slider from 'rc-slider';
import {Button, ButtonGroup} from 'react-bootstrap';
import classnames from 'classnames';
import {ViewerResponsive, ViewerHelper} from 'react-svg-pan-zoom';
import range from 'node-range';
import * as C from 'persistent-c';
import adt from 'adt';

import {
  getNumber, getIdent, getList, renderArrow, renderValue, evalExpr,
  highlightColors} from './utils';
import {getCursorMap, finalizeCursors} from './array_utils';
import {enumerateHeapBlocks} from '../stepper/malloc';

const List = adt.data(function () {
  return {
    Nil: null,
    Cons: {
      head: adt.any,
      tail: adt.only(this)
    }
  };
});

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
  const {nBytesShown, cursorRows} = options;
  const maxAddress = memory.size;
  const centerAddress = Math.floor(options.centerAddress);
  let startAddress = centerAddress - nBytesShown / 2;
  if (startAddress + nBytesShown >= maxAddress) {
    startAddress = maxAddress - nBytesShown;
  }
  let endAddress = startAddress + nBytesShown - 1;
  // Show 1 extra cell if address has a floating part.
  if (options.centerAddress !== centerAddress) {
    endAddress += 1;
  }
  const cells = [];
  const byteOps = []; // spare array of {load,store} objects
  for (let address = startAddress; address <= endAddress; address += 1) {
    const current = memory.get(address);
    const cell = {column: address, address, size: 1, current};
    if (address === centerAddress) {
      cell.center = true;
    }
    const ops = saveByteMemoryOps(byteOps, memoryLog, address);
    cell.load = ops.load;
    if (ops.store !== undefined) {
      cell.store = ops.store;
      cell.previous = oldMemory.get(address);
    }
    cells.push(cell);
  }
  const bytes = {startAddress, endAddress, cells};
  // Build the cursor views.
  const cursorMap = getCursorMap(
    core, localMap, options.cursorExprs, {
      minIndex: startAddress, maxIndex: endAddress,
      address: 0, cellSize: 1
    });
  finalizeCursors(range(startAddress, endAddress + 1), cursorMap, options.cursorRows);
  // Build the variables view.
  const variables = viewVariables(core, byteOps, startAddress, endAddress, options);
  // Build the extra-type views.
  const extraRows = [];
  options.extraExprs.forEach(function (expr) {
    try {
      const ref = evalExpr(core, localMap, expr, true);
      if (ref && /^(scalar|pointer)$/.test(ref.type.pointee.kind)) {
        const row = viewExtraCells(core, byteOps, ref, startAddress, endAddress);
        extraRows.push(row);
      }
    } catch (ex) {
      //console.log('failed to evaluate extra expression', expr, ex);
    }
  });
  // Add heap structure annotations to bytes.
  const heapMap = viewHeapFlags(core, startAddress, endAddress);
  return {byteOps, bytes, cursorMap, cursorRows, variables, extraRows, heapMap};
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
  for (let address = start; address <= end; address += 1) {
    const ops = byteOps[address];
    if (ops) {
      load = maxDefinedRank(load, ops.load);
      store = maxDefinedRank(store, ops.store);
    }
  }
  return {load, store};
};

const viewExtraCells = function (core, byteOps, ref, startAddress, endAddress) {
  const refType = ref.type;
  const {size} = refType.pointee;
  // Align `startAddress` with `ref`.
  const alignment = ref.address % size;
  startAddress -= startAddress % size - alignment;
  const cells = [];
  for (let address = startAddress; address + size - 1 <= endAddress; address += size) {
    const valRef = {...ref, address};
    const cell = viewValue(core, byteOps, valRef);
    cells.push(cell);
  }
  return {size, cells};
};

const viewVariables = function (core, byteOps, startAddress, endAddress, options) {
  const cells = [];
  const {memory, globalMap} = core;
  let {scope} = core;
  // Materialize the stack pointer.
  if (scope) {
    cells.push({sep: 'sp', address: scope.limit});
  }
  // Go up the stack until we find an area that contains startAddress.
  while (scope && scope.limit < startAddress) {
    const {type} = scope;
    if (type && scope.limit + type.size >= startAddress) {
      break;
    }
    scope = scope.parent;
  }
  // View cells until a stack area starts past endAddress.
  while (scope && scope.limit <= endAddress) {
    const {limit, kind} = scope;
    switch (kind) {
      case 'variable': {
        const {name, ref} = scope;
        viewVariable(cells, core, byteOps, startAddress, endAddress, name, ref);
        break;
      }
      case 'block':
        cells.push({sep: 'block', address: limit});
        break;
      case 'function':
        cells.push({sep: 'function', address: limit});
        break;
    }
    scope = scope.parent;
  }
  Object.keys(globalMap).forEach(function (name) {
    // Values in globalMap are BuiltinValue and PointerValue, and we only
    // care about pointers.
    const value = globalMap[name];
    if (value instanceof C.PointerValue) {
      viewVariable(cells, core, byteOps, startAddress, endAddress, name, value);
    }
  });
  return {cells};
};

const viewVariable = function (cells, core, byteOps, startAddress, endAddress, name, ref) {
  for (let value of allValuesInRange(List.Nil, ref.type, ref.address, startAddress, endAddress)) {
    const cell = viewValue(core, byteOps, value.ref);
    cell.name = formatLabel(name, value.path);
    cells.push(cell);
  }
};

const formatLabel = function (name, path) {
  const elems = [];
  while (!path.isNil) {
    const elem = path.get(0);
    if (typeof elem === 'number') {
      elems.unshift(`[${elem}]`);
    } else if (typeof elem === 'string') {
      elems.unshift(`.${elem}`);
    } else {
      elems.unshift('?');
    }
    path = path.get(1);
  }
  elems.unshift(name);
  return elems.join('');
};

const allValuesInRange = function* (path, refType, address, startAddress, endAddress) {
  const type = refType.pointee;
  const size = type.size;
  if (type.kind === 'scalar' || type.kind === 'pointer') {
    if (startAddress <= address && address + size - 1 <= endAddress) {
      const ref = new C.PointerValue(refType, address);
      yield {ref, path};
    }
  }
  if (type.kind === 'array') {
    const elemType = type.elem;
    const elemCount = type.count.toInteger();
    const elemTypePtr = C.pointerType(elemType);
    let firstIndex = Math.floor((startAddress - address) / elemType.size);
    let lastIndex = Math.floor((endAddress - address) / elemType.size);
    if (firstIndex < elemCount && lastIndex >= 0) {
      firstIndex = Math.max(firstIndex, 0);
      lastIndex = Math.min(lastIndex, elemCount - 1);
      for (let index = firstIndex; index <= lastIndex; index += 1) {
        yield* allValuesInRange(
          List.Cons(index, path),
          elemTypePtr, address + index * elemType.size,
          startAddress, endAddress);
      }
    }
  }
};

const viewValue = function (core, byteOps, ref) {
  const {address} = ref;
  const {size} = ref.type.pointee;
  const current = C.readValue(core.memory, ref);
  const cell = {address, size, current};
  const ops = getByteRangeOps(byteOps, address, address + size - 1);
  cell.load = ops.load;
  if (ops.store !== undefined) {
    cell.store = ops.store;
    cell.previous = C.readValue(core.oldMemory, ref);
  }
  return cell;
};

const allMarkers = function* (core, localMap, cursorExprs) {
  const {memoryLog, globalMap} = core;
  // XXX The initial heap start is a constant in persistent-c.
  yield {kind: 'start', address: 0x100};
  // Cursors
  for (let expr of cursorExprs) {
    try {
      const value = evalExpr(core, localMap, expr, false);
      if (value.type.kind === 'pointer') {
        yield {kind: 'cursor', address: value.address};
      }
    } catch (ex) {
      // skip
    }
  }
  // Memory log (load, store)
  for (let entry of memoryLog) {
    const kind = entry[0];
    const ref = entry[1];
    yield {kind, address: ref.address};
  }
  // Globals
  for (let name of Object.keys(globalMap)) {
    const value = globalMap[name];
    if ('address' in value) {
      yield {kind: 'global', address: value};
    }
  }
  // Stack: function boundaries
  let scope = core.scope;
  while (scope) {
    if (scope.kind === 'function') {
      yield {kind: scope.kind, address: scope.limit};
    }
    scope = scope.parent;
  }
};

const viewHeapFlags = function (core, startAddress, endAddress) {
  const heapMap = []; // sparse array
  for (let block of enumerateHeapBlocks(core)) {
    const {start, end} = block;
    if (start <= endAddress && end >= startAddress) {
      // Mark header area bytes
      for (let address = block.ref.address; address < start; address += 1) {
        heapMap[address] = 16;
      }
      // Mark data area bytes
      const viewStart = Math.max(start, startAddress);
      const viewEnd = Math.min(end, endAddress);
      const defaultFlag = block.free ? 3 : 1;
      for (let address = viewStart; address <= viewEnd; address += 1) {
        let flags = defaultFlag;
        if (address === start) {
          flags |= 4;
        }
        if (address === end) {
          flags |= 8;
        }
        heapMap[address] = flags;
      }
    }
  }
  return heapMap;
};

export const MemoryView = EpicComponent(self => {

  const textLineHeight = 18;
  const textBaseline = 5;
  const cellWidth = 32;
  const cellPadding = 4;
  const cellHeight = cellPadding * 2 + textLineHeight * 2;
  const addressAngle = 60;
  const addressSize = rotate(addressAngle, 40, textLineHeight)
  const marginLeft = 10;
  const marginTop = 10;
  const marginBottom = 10;
  const cellMargin = 4;
  const nBytesShown = 32;
  const minArrowHeight = 20;

  const drawLabels = function (view) {
    const {cells} = view.bytes;
    const elements = [];
    const x0 = marginLeft;
    const y0 = view.layout.labelsTop + addressSize.y;
    const dx1 = cellWidth / 2 - addressSize.x / 2; // address label x offset
    for (let i = 0; i < cells.length; i += 1) {
      const cell = cells[i];
      const {column, address, center} = cell;
      const x1 = x0 + column * cellWidth;
      // Top and bottom horizontal lines.
      if (address !== undefined) {
        elements.push(
          <text key={address} transform={`translate(${x1+dx1},${y0}) rotate(${-addressAngle})`} className={center && 'center'}>
            {formatAddress(address)}
          </text>
        );
      }
    }
    return <g className='labels'>{elements}</g>;
  };

  const GridDrawer = function (y0) {
    let rx;  // right border not drawn
    let finalEndCol;
    const hs = [], vs = [], rs = [];
    const ccs = {};
    const x0 = marginLeft;
    const y1 = y0 + cellHeight;
    return {
      drawCellBorder: function (startCol, endCol) {
        const lx = x0 + startCol * cellWidth;
        rx = x0 + endCol * cellWidth;
        finalEndCol = endCol;
        vs.push({key: `v${startCol}`, x: lx, y1: y0, y2: y1});
        hs.push({key: `ht${startCol}`, x1: lx, x2: rx, y: y0});
        hs.push({key: `hb${startCol}`, x1: lx, x2: rx, y: y1});
      },
      fillCellBackground: function (startCol, endCol, className) {
        const x = x0 + startCol * cellWidth;
        const w = (endCol - startCol) * cellWidth;
        rs.push({key: `r${startCol}`, x, w, className});
      },
      addCellClassName: function (col, className) {
        const key = `v${col}`;
        if (key in ccs) {
          ccs[key] = ccs[key] + ' ' + className;
        } else {
          ccs[key] = className;
        }
      },
      finalize: function () {
        // Add the right border of the last cell.
        if (finalEndCol !== undefined) {
          vs.push({key: `v${finalEndCol}`, x: rx, y1: y0, y2: y1});
        }
        // Render the horizontal and vertical elements.
        const elements = [];
        for (let i = 0; i < rs.length; i += 1) {
          const {key, x, w, className} = rs[i];
          elements.push(<rect key={key} x={x} y={y0} width={w} height={cellHeight} className={className}/>);
        }
        for (let i = 0; i < hs.length; i += 1) {
          const {key, x1, x2, y} = hs[i];
          elements.push(<line key={key} x1={x1} x2={x2} y1={y} y2={y} className='h' />);
        }
        for (let i = 0; i < vs.length; i += 1) {
          const {key, x, y1, y2} = vs[i];
          const className = classnames(['v', ccs[key]]);
          elements.push(<line key={key} x1={x} x2={x} y1={y1} y2={y2} className={className} />);
        }
        return elements;
      }
    };
  };

  const setCellClasses = function (view) {
    const {bytes, cursorMap, heapMap} = view;
    for (let cell of bytes.cells) {
      const {address, store, load} = cell;
      const cursor = cursorMap[address];
      const heapFlags = heapMap[address];
      const classes = ['cell'];
      if (store !== undefined) {
        classes.push('cell-store');
      }
      if (load !== undefined) {
        classes.push('cell-load');
      }
      if (cursor) {
        classes.push("cell-cursor");
      }
      if (heapFlags !== undefined) {
        classes.push("cell-heap");
        if (heapFlags & 16) {
          classes.push('cell-heap-header');
        }
        if (heapFlags & 2) {
          classes.push('cell-heap-free');
        }
      }
      cell.classes = classnames(classes);
    }
  };

  const drawGrid = function (view) {
    const {bytes, variables, extraRows, cursorMap, heapMap} = view;
    const grids = [];
    // Bytes grid
    const gd1 = GridDrawer(view.layout.bytesTop);
    for (let i = 0; i < bytes.cells.length; i += 1) {
      const cell = bytes.cells[i];
      const {address} = cell;
      gd1.drawCellBorder(address, address + 1);
      gd1.fillCellBackground(address, address + 1, cell.classes);
    }
    grids.push(<g className='bytes'>{gd1.finalize()}</g>);
    // Variables grid
    const gd2 = GridDrawer(view.layout.variablesTop);
    for (let i = 0; i < variables.cells.length; i += 1) {
      const cell = variables.cells[i];
      if (cell.sep) {
        gd2.addCellClassName(cell.address, cell.sep);
      } else {
        gd2.drawCellBorder(cell.address, cell.address + cell.size);
      }
    }
    grids.push(<g className='variables'>{gd2.finalize()}</g>);
    // Extra rows grid
    extraRows.forEach(function (extraRow, i) {
      const {cells, size} = extraRow;
      const gd = GridDrawer(view.layout.extraRowsTop + i * (cellHeight + cellMargin));
      cells.forEach(function (cell, j) {
        gd.drawCellBorder(cell.address, cell.address + size);
      });
      grids.push(<g className={`extras-${i}`}>{gd.finalize()}</g>);
    });
    return <g className='grid'>{grids}</g>;
  };

  const drawCell = function (cell) {
    if (cell.gap)
      return false;
    const {column, address} = cell;
    const x0 = marginLeft + column * cellWidth;
    const y0 = this.layout.bytesTop;
    return (
      <g className={cell.classes} key={`0x${address}`} transform={`translate(${x0},${y0})`} clipPath='url(#cell)'>
        {drawCellContent(cell, 'byte', formatByte)}
      </g>
    );
  };

  const drawVariables = function (view) {
    const {layout, variables} = view;
    const {cells} = variables;
    const elements = [];
    const x0 = marginLeft;
    const y0 = layout.variablesTop;
    const y1 = cellHeight + cellMargin + textLineHeight - textBaseline;
    cells.forEach(function (cell) {
      if (!cell.sep) {
        const {address, size, name} = cell;
        const x = x0 + address * cellWidth;
        const x1 = size * cellWidth / 2;
        elements.push(
          <g className='cell' key={`0x${address}`} transform={`translate(${x},${y0})`}>
            {drawCellContent(cell, 'variable', renderValue)}
            <text x={x1} y={y1}>{name}</text>
          </g>
        );
      }
    });
    return <g className='variables'>{elements}</g>;
  };

  const drawExtraRow = function (row, i) {
    const {size, cells} = row;
    const elements = [];
    const x0 = marginLeft;
    const y0 = this.layout.extraRowsTop + i * cellHeight;
    const width = size * cellWidth;
    cells.forEach(function (cell) {
      const {address} = cell;
      const x = x0 + address * cellWidth;
      elements.push(
        <g className='cell' key={`0x${address}`} transform={`translate(${x},${y0})`}>
          {drawCellContent(cell, 'extra', renderValue)}
        </g>
      );
    });
    return <g className='extraRow'>{elements}</g>;
  };

  const drawCellContent = function (cell, className, format) {
    const {current, size, load, store, previous} = cell;
    const width = size * cellWidth;
    const x0 = width / 2;
    const y0 = cellPadding + textLineHeight - textBaseline;
    const y1 = y0 + textLineHeight;
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
    const {cursorRows} = this;
    const {index, row, color, labels} = cursor;
    const x0 = marginLeft + index * cellWidth;
    const y0 = this.layout.cursorsTop;
    const arrowHeight = minArrowHeight + (cursorRows - row - 1) * textLineHeight;
    const x1 = cellWidth / 2;
    const y1 = row * textLineHeight + textLineHeight - textBaseline;
    const y2 = cursorRows * textLineHeight + minArrowHeight;
    const fillColor = '#eef';
    return (
      <g key={`c${index}`} transform={`translate(${x0},${y0})`} className='cursor'>
        <text x={x1} y={y1}>{labels.join(",")}</text>
        {renderArrow(cellWidth / 2, y2, 'down', 6, arrowHeight)}
      </g>
    );
  };

  const getCenterAddress = function () {
    let address = self.props.controls.get('centerAddress');
    if (address === undefined) {
      address = clipCenterAddress(getNumber(self.props.directive.byName.start, nBytesShown / 2));
    }
    return address;
  };

  const clipCenterAddress = function (address) {
    address -= nBytesShown / 2;
    address = Math.max(0, address);
    address = Math.min(self.props.context.core.memory.size - nBytesShown, address);
    address += nBytesShown / 2;
    return address;
  };

  const getViewState = function (centerAddress) {
    const startAddress = centerAddress - nBytesShown / 2;
    const {scale, controls, directive} = self.props;
    const x = -startAddress * cellWidth * scale;
    return {
      matrix: {a: scale, b: 0, c: 0, d: scale, e: x, f: 0},
      mode: controls.get('mode', 'idle'),
      startX: controls.get('startX'),
      startY: controls.get('startY')
    };
  };

  const onShiftLeft = function (event) {
    const fallThrough = false; // XXX could be an option
    const {directive, frames, context} = self.props;
    const {core} = context;
    const localMap = frames[0].get('localMap');
    const cursorExprs = getList(directive.byName.cursors, []);
    // Pretend currentAddress is just past the left of the visible area.
    const currentAddress = getCenterAddress() - nBytesShown / 2;
    let nextAddress;
    let maxAddress = currentAddress;
    for (let marker of allMarkers(core, localMap, cursorExprs)) {
      const {kind, address} = marker;
      if (address < currentAddress && (nextAddress === undefined || address > nextAddress)) {
        nextAddress = address;
      }
      if (address > maxAddress) {
        maxAddress = address;
      }
    }
    if (fallThrough && nextAddress === undefined) {
      nextAddress = maxAddress;
    }
    if (nextAddress !== undefined) {
      nextAddress = clipCenterAddress(nextAddress);
      self.props.onChange(self.props.directive, {centerAddress: nextAddress});
    }
  };

  const onShiftRight = function (event) {
    const fallThrough = false; // XXX could be an option
    const {directive, frames, context} = self.props;
    const {core} = context;
    const localMap = frames[0].get('localMap');
    const cursorExprs = getList(directive.byName.cursors, []);
    // Pretend currentAddress is just past the right of the visible area.
    const currentAddress = getCenterAddress() + nBytesShown / 2;
    let nextAddress;
    let minAddress = currentAddress;
    for (let marker of allMarkers(core, localMap, cursorExprs)) {
      const {kind, address} = marker;
      if (currentAddress < address && (nextAddress === undefined || address < nextAddress)) {
        nextAddress = address;
      }
      if (address < minAddress) {
        minAddress = address;
      }
    }
    if (fallThrough && nextAddress === undefined) {
      nextAddress = minAddress;
    }
    if (nextAddress !== undefined) {
      nextAddress = clipCenterAddress(nextAddress);
      self.props.onChange(self.props.directive, {centerAddress: nextAddress});
    }
  };

  const onSeek = function (centerAddress) {
    // Clear the LSB.
    centerAddress = centerAddress ^ (centerAddress & 0xFF);
    // Preserve the current 16-bit alignment.
    centerAddress |= getCenterAddress() & 0xF0;
    // Clip to valid range.
    centerAddress = clipCenterAddress(centerAddress);
    self.props.onChange(self.props.directive, {centerAddress});
  };

  const onViewChange = function (event) {
    const {mode, startX, startY, matrix} = event.value;
    const {directive, scale} = self.props;
    const centerAddress = clipCenterAddress(-matrix.e / (cellWidth * scale) + nBytesShown / 2);
    const update = {mode, startX, startY, centerAddress};
    self.props.onChange(directive, update);
  };

  self.render = function () {
    const {Frame, controls, directive, frames, context, scale} = self.props;
    const localMap = frames[0].get('localMap');
    const {core} = context;
    const {byName, byPos} = directive;
    const extraExprs = getList(byName.extras, []);
    const cursorExprs = getList(byName.cursors, []);
    const cursorRows = getNumber(byName.cursorRows, 1);
    const nBytesShown = getNumber(byName.bytes, 32);
    // Controls
    const centerAddress = getCenterAddress();
    const viewState = getViewState(centerAddress);
    // Extract the view-model.
    const maxAddress = self.props.context.core.memory.size;
    const view = extractView(
      core,
      localMap,
      {
        centerAddress,
        nBytesShown,
        cursorExprs,
        cursorRows,
        extraExprs
      });
    // The objects in view.bytes are mutated to add the 'classes' property.
    setCellClasses(view);
    const layout = view.layout = {};
    layout.cursorsHeight = cursorRows * textLineHeight + minArrowHeight;
    layout.labelsHeight = addressSize.y;
    layout.bytesHeight = cellHeight;
    layout.variablesHeight = cellMargin + cellHeight + textLineHeight;
    layout.extraRowsHeight = (cellHeight + cellMargin) * extraExprs.length;
    layout.cursorsTop = marginTop;
    layout.labelsTop = layout.cursorsTop + layout.cursorsHeight;
    layout.bytesTop = layout.labelsTop + marginTop + layout.labelsHeight;
    layout.variablesTop = layout.bytesTop + layout.bytesHeight;
    layout.extraRowsTop = layout.variablesTop + layout.variablesHeight;
    layout.bottom = layout.extraRowsTop + layout.extraRowsHeight - cellMargin + marginBottom;
    const svgWidth = marginLeft + cellWidth * maxAddress;
    const svgHeight = layout.bottom;
    const divHeight = (svgHeight * scale) + 'px';
    return (
      <Frame {...self.props}>
        <div className="memory-controls directive-controls">
          <div className="memory-slider-container" style={{width: '400px'}}>
            <Slider prefixCls="memory-slider" tipFormatter={null} value={centerAddress} min={0} max={maxAddress} onChange={onSeek}>
              <div className="memory-slider-background"/>
            </Slider>
          </div>
          <ButtonGroup>
            <Button onClick={onShiftLeft} title="shift view to the left">
              <i className="fa fa-arrow-left"/>
            </Button>
            <Button onClick={onShiftRight} title="shift view to the right">
              <i className="fa fa-arrow-right"/>
            </Button>
          </ButtonGroup>
        </div>
        <div className='clearfix' style={{padding: '2px'}}>
          <div style={{width: '100%', height: divHeight}}>
            <ViewerResponsive tool='pan' value={viewState} onChange={onViewChange} background='transparent' specialKeys={[]}>
              <svg width={svgWidth} height={svgHeight} version='1.1' xmlns='http://www.w3.org/2000/svg'>
                <g className='memory-view'>
                  {drawGrid(view)}
                  {drawLabels(view)}
                  <g className='cursors'>{view.cursorMap.map(drawCursor.bind(view))}</g>
                  <g className='bytes'>{view.bytes.cells.map(drawCell.bind(view))}</g>
                  {drawVariables(view)}
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
