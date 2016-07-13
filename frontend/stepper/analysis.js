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

export const collectDirectives = function (frames, focusDepth) {
  const ordered = [];
  const framesMap = {};
  // Frames are collected in reverse order, so that the directive's render
  // function should use frames[key][0] to access the innermost frame.
  for (let depth = frames.size - 1 - focusDepth; depth >= 0; depth -= 1) {
    const frame = frames.get(depth);
    const directives = frame.get('directives');
    directives.forEach(function (directive) {
      const {key} = directive;
      if (key in framesMap) {
        framesMap[key].push(frame);
      } else {
        ordered.push(directive);
        framesMap[key] = [frame];
      }
    })
  }
  return {ordered, framesMap};
};
