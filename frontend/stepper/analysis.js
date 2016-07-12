/*

A `Stored Value` can have one of these shapes:
  {kind: 'scalar', ref, current, previous, load, store}
  {kind: 'array', count, cells: [{index, address, content}]}

*/

import Immutable from 'immutable';
import * as C from 'persistent-c';

export const StackFrame = Immutable.Record({
  scope: null, key: null, func: null, args: null,
  localNames: Immutable.List(),
  localMap: Immutable.Map(),
  directives: Immutable.List()
});

export const analyseState = function (core) {
  const frames = analyseScope(core.scope);
  const result = {frames};
  if (core.direction === 'out') {
    result.callReturn = {
      func: core.control.values[0],
      args: core.control.values.slice(1),
      result: core.result
    };
  }
  return Object.freeze(result);
};

/*
  Recursively analyse the interpreter's scope structure and build convenient
  Immutable data structures.  Good candidate for memoisation.
*/
const analyseScope = function (scope) {
  if (!scope) {
    return Immutable.List()
  }
  let frames = analyseScope(scope.parent);
  // 'function' and 'block' scopes have directives,
  // 'function' scopes clears the active directives.
  switch (scope.kind) {
    case 'function': {
      const func = scope.values[0];
      const args = scope.values.slice(1);
      frames = frames.push(StackFrame({
        scope: scope,
        key: scope.key,
        func,
        args,
        directives: Immutable.List(scope.directives)
      }));
      break;
    }
    case 'block': {
      frames = frames.updateIn([frames.size - 1, 'directives'], directives =>
        directives.concat(scope.directives));
      break;
    }
    case 'variable': {
      const {name, type, ref} = scope;
      frames = frames.update(frames.size - 1, function (frame) {
        // Append the name to the list of local names, taking care of shadowing.
        frame = frame.update('localNames', function (localNames) {
          const i = localNames.indexOf(name);
          if (-1 !== i) {
            localNames = localNames.delete(i);
          }
          localNames = localNames.push(name);
          return localNames;
        });
        // Associate the name with a (frozen) {type, ref} object.
        frame = frame.setIn(['localMap', name], Object.freeze({type, ref}));
        return frame;
      });
      break;
    }
  }
  return frames;
};

export const viewFrame = function (core, frame, options) {
  const view = {
    key: frame.get('scope').key,
    func: frame.get('func'),
    args: frame.get('args')
  };
  if (options.locals) {
    const localMap = frame.get('localMap');
    const locals = view.locals = [];
    frame.get('localNames').forEach(function (name) {
      const {type, ref} = localMap.get(name);
      // type and ref.type.pointee are assumed identical
      locals.push(viewVariable(core, name, type, ref.address));
    });
  }
  return view;
};

export const viewVariable = function (core, name, type, address) {
  return {
    name,
    type,
    address,
    value: readValue(core, C.pointerType(type), address)
  };
};

export const readValue = function (core, refType, address) {
  const type = refType.pointee;
  if (type.kind === 'array') {
    const cells = readArray1D(core, type, address);
    return {kind: 'array', count: type.count, cells};
  }
  return readScalar(core, refType, address);
};

const readScalar = function (core, refType, address) {
  // Produce a 'stored scalar value' object whose shape is
  //   {ref, current, previous, load, store}
  // where:
  //   - 'ref' holds the value's reference (a pointer value)
  //   - 'current' holds the current value
  //   - 'load' holds the smallest rank of a load in the memory log
  //   - 'store' holds the greatest rank of a store in the memory log
  //   - 'previous' holds the previous value (if 'store' is defined)
  const ref = new C.PointerValue(refType, address);
  const result = {kind: 'scalar', ref: ref, current: C.readValue(core.memory, ref)}
  core.memoryLog.forEach(function (entry, i) {
    if (refsIntersect(ref, entry[1])) {
      if (entry[0] === 'load') {
        if (result.load === undefined) {
          result.load = i;
        }
      } else if (entry[0] === 'store') {
        result.store = i;
      }
    }
  });
  if ('store' in result) {
    result.previous = C.readValue(core.oldMemory, ref);
  }
  return result;
};

export const readArray1D = function (core, arrayType, address) {
  const elemCount = arrayType.count.toInteger();
  const elemType = arrayType.elem;
  const elemSize = elemType.size;
  const elemRefType = C.pointerType(elemType);
  const cells = [];
  for (let index = 0; index < elemCount; index += 1) {
    const content = readValue(core, elemRefType, address);
    cells.push({index, address, content});
    address += elemSize;
  }
  return cells;
};

const refsIntersect = function (ref1, ref2) {
  const base1 = ref1.address, limit1 = base1 + ref1.type.pointee.size - 1;
  const base2 = ref2.address, limit2 = base2 + ref2.type.pointee.size - 1;
  const result = (base1 <= base2) ? (base2 <= limit1) : (base1 <= limit2);
  return result;
};
