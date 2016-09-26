
import * as C from 'persistent-c';

const voidPtr = C.pointerType(C.voidType);
const uint = C.scalarTypes['unsigned int'];
const uintPtr = C.pointerType(uint);
const uintPtrPtr = C.pointerType(uintPtr);
const headerSize = 4;

const nullPointer = new C.PointerValue(voidPtr, 0);

/*
Block properties:
  - ref: reference to the block header
  - next: reference to the header of the next block
  - size: raw block size, including header and data areas
  - free: boolean indicating if block is free (true) or allocated (false)
  - start: address of the first byte of the block's data area
  - end: address of the last byte of the block's data area
*/
const getBlock = function (memory, ref) {
  const header = C.readValue(memory, ref).toInteger();
  const size = header & ~3;
  if (size === 0) {
    return;
  }
  const free = 0 !== (header & 1);
  const start = ref.address + headerSize;
  const end = ref.address + size - 1;
  const next = new C.PointerValue(uintPtr, ref.address + size);
  return {ref, free, start, end, size, next};
};

const getFirstBlock = function (core) {
  const ref = new C.PointerValue(uintPtr, core.heapStart);
  return getBlock(core.memory, ref);
};

const canAllocate = function (block, nBytes) {
  return block.free && block.size - headerSize >= nBytes;
};

const allocateBlock = function (effects, block, nBytes) {
  // Align the block on a 4-byte boundary.
  nBytes = (nBytes + 3) & ~3;
  const netSize = headerSize + nBytes;
  // Can the block be split?
  if (block.size > netSize + headerSize) {
    // Write a header for the (new) next block.
    const nextRef = new C.PointerValue(block.ref.type, block.ref.address + netSize);
    // Compute the next block size, set the free bit.
    const nextHeader = (block.size - netSize) | 1;
    effects.push(['store', nextRef, new C.IntegralValue(uint, nextHeader)]);
  } else {
    nBytes = block.size;
  }
  // The new header is the size in bytes with the free bit (0) clear.
  const newHeader = netSize;
  effects.push(['store', block.ref, new C.IntegralValue(uint, newHeader)]);
  return new C.PointerValue(voidPtr, block.start);
};

const freeBlock = function (effects, block, prev, next) {
  let ref = block.ref;
  let size = block.size;
  if (prev && prev.free) {
    ref = prev.ref;
    size += prev.size;
  }
  if (next && next.free) {
    size += next.size;
  }
  // The header is the size in bytes with the free bit (0) *set*.
  effects.push(['store', ref, new C.IntegralValue(uint, size | 1)]);
};

export const heapInit = function (core, stackBytes) {
  let {memory, heapStart} = core;
  const headerRef = new C.PointerValue(uintPtr, core.heapStart);
  const header = new C.IntegralValue(uint, (memory.size - heapStart - stackBytes) | 1);
  memory = C.writeValue(memory, headerRef, header);
  const block = getBlock(memory, headerRef);
  const terminator = new C.IntegralValue(uint, 0);
  memory = C.writeValue(memory, block.next, terminator);
  return {...core, memory};
};

export const malloc = function (core, cont, values) {
  const {memory} = core;
  const effects = [];
  const nBytes = values[1].toInteger();
  let result = nullPointer;
  let block = getFirstBlock(core);
  while (block) {
    if (canAllocate(block, nBytes)) {
      result = allocateBlock(effects, block, nBytes);
      break;
    }
    block = getBlock(memory, block.next);
  }
  return {control: cont, result, effects}
};

export const free = function (core, cont, values) {
  // The block chain is traversed for these reasons:
  // * prevent heap corruption;
  // * locate the block immediately before the freed block,
  //   so the blocks can be merged;
  // * performance is low priority.
  const {memory} = core;
  const effects = [];
  const address = values[1].address;
  let block = getFirstBlock(core);
  let prev;
  while (block) {
    const next = getBlock(memory, block.next);
    if (block.start === address) {
      freeBlock(effects, block, prev, next);
      break;
    }
    prev = block;
    block = next;
  }
  return {control: cont, result: null, effects};
};
