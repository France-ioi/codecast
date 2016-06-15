
/*

  In global state, view options:
    - map(view name → view state)

  In reducer, view props:
    - stepper state → map(view name → view data)

  In render:
    - (view state, view data) → {Component, props}

Return value: state.control && state.control.return && state.result

*/

import Immutable from 'immutable';
import {readValue} from 'persistent-c';

export const analyseState = function (state) {
  const {frames, directives} = analyseScope(state.scope);
  const result = {frames, directives};
  if (state.direction === 'out') {
    result.callReturn = {
      func: state.control.values[0],
      args: state.control.values.slice(1),
      result: state.result
    };
  }
  return result;
};

/*
  Recursively analyse the interpreter's scope structure and build convenient
  Immutable data structures.  Good candidate for memoisation.
*/
const analyseScope = function (scope) {
  if (!scope) {
    return {
      frames: Immutable.List(),
      directives: Immutable.Map()
    };
  }
  let {frames, directives} = analyseScope(scope.parent);
  switch (scope.kind) {
    case 'function': {
      const func = scope.values[0];
      const args = scope.values.slice(1);
      frames = frames.push(Immutable.Map({
        scope: scope,
        key: scope.key,
        func,
        args,
        localNames: Immutable.List(),
        localMap: Immutable.Map()
      }));
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
  if ('directives' in scope) {
    // TODO
  }
  return {frames, directives};
};

export const viewFrame = function (state, frame, options) {
  const view = {
    func: frame.get('func'),
    args: frame.get('args')
  };
  if (options.locals) {
    const localMap = frame.get('localMap');
    const locals = view.locals = [];
    frame.get('localNames').forEach(function (name) {
      const {type, ref} = localMap.get(name);
      locals.push(viewVariable(state, name, type, ref));
    });
  }
  return view;
};

const viewVariable = function (state, name, type, ref) {
  const result = {name, type};
  try {
    if (type.kind === 'array') {
      // TODO: display the first elements of an array (if its size is known)
      return result;
    }
    result.value = viewRef(state, ref);
  } catch (err) {
    result.error = err;
  }
  return result;
};

const viewRef = function (state, ref) {
  const result = {ref: ref, current: readValue(state.memory, ref)}
  state.memoryLog.forEach(function (entry, i) {
    if (refsIntersect(ref, entry[1])) {
      if (entry[0] === 'load') {
        if (result.load === undefined) {
          result.load = i;
        }
      } else if (entry[0] === 'store') {
        if (result.store === undefined) {
          result.store = i;
          result.previous = readValue(state.oldMemory, ref);
        }
      }
    }
  });
  return result;
};

const refsIntersect = function (ref1, ref2) {
  const base1 = ref1.address, limit1 = base1 + ref1.type.pointee.size - 1;
  const base2 = ref2.address, limit2 = base2 + ref2.type.pointee.size - 1;
  const result = (base1 <= base2) ? (base2 <= limit1) : (base1 <= limit2);
  return result;
};

/*

const getIdent = function (expr) {
  return expr[0] === 'ident' && expr[1];
};

const prepareDirective = function (directive, scope, index, decls, state) {
  if (Array.isArray(directive)) {
    const key = `${scope.key}.${index}`;
    directive = {key, kind: directive[0], byPos: directive[1], byName: directive[2]}
  }
  let {key, kind, byPos, byName} = directive;
  const result = {key, kind};
  switch (kind) {
    case 'showVar':
      {
        const ident = result.name = getIdent(byPos[0]);
        if (!ident) {
          result.error = 'invalid variable name';
          break;
        }
        const varScope = decls[ident];
        if (varScope) {
          result.value = inspectPointer(varScope.ref, state);
        }
        break;
      }
    case 'showArray':
      {
        const ident = result.name = getIdent(byPos[0]);
        const varScope = decls[ident];
        if (varScope) {
          // Expect varScope.ref to be a pointer to an array.
          if (varScope.ref.type.kind !== 'pointer') {
            result.error = 'reference is not a pointer';
            break;
          }
          const varType = varScope.ref.type.pointee;
          if (varType.kind !== 'array') {
            result.error = 'expected a reference to an array';
          }
          // Extract the array's address, element type and count.
          const address = result.address = varScope.ref.address;
          const elemType = result.elemType = varType.elem;
          const elemCount = result.elemCount = varType.count.toInteger();
          // Inspect each array element.
          const elems = result.elems = [];
          const ptr = new PointerValue(pointerType(elemType), address);
          for (let elemIndex = 0; elemIndex < elemCount; elemIndex += 1) {
            elems.push({value: inspectPointer(ptr, state), cursors: [], prevCursors: []});
            ptr.address += elemType.size;
          }
          // Add an extra empty element.
          elems.push({value: {}, cursors: [], prevCursors: [], last: true});
          // Cursors?
          if (byName.cursors && byName.cursors[0] === 'list') {
            const cursorIdents = byName.cursors[1].map(getIdent);
            cursorIdents.forEach(function (cursorIdent) {
              const cursorScope = decls[cursorIdent];
              if (cursorScope) {
                const cursorValue = inspectPointer(cursorScope.ref, state);
                const cursorPos = cursorValue.value.toInteger();
                if (cursorPos >= 0 && cursorPos <= elemCount) {
                  elems[cursorPos].cursors.push(cursorIdent);
                }
                if (cursorValue.prevValue) {
                  const cursorPrevPos = cursorValue.prevValue.toInteger();
                  if (cursorPrevPos >= 0 && cursorPrevPos <= elemCount) {
                    elems[cursorPrevPos].prevCursors.push(cursorIdent);
                  }
                }
              }
            })
          }
        }
        break;
      }
    default:
      result.error = `unknown directive ${kind}`;
      return
  }
  return result;
};

const getViews = function (state) {
  const views = [];
  const directives = {};
  let decls = {};
  let scope = state.scope;
  while (scope) {
    if ('decl' in scope) {
      // param or vardecl
      const name = scope.decl.name;
      if (!(name in decls)) {
        decls[scope.decl.name] = scope;
      }
    }
    if ('directives' in scope) {
        scope.directives.forEach((directive, i) => views.push(prepareDirective(directive, scope, i, decls, state)));
    }
    if (scope.kind === 'function') {
        decls = {};
    }
    scope = scope.parent;
  }
  return views;
};

*/
