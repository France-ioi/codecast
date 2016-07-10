
import React from 'react';
import {Panel} from 'react-bootstrap';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import {inspectPointer, pointerType, PointerValue} from 'persistent-c';

import {defineSelector, defineView} from '../utils/linker';
import {VarDecl, StoredValue, Array1D, Array1DSvg} from './view_utils';
import {viewVariable, readArrayWithCursors} from './analysis';

const getIdent = function (expr) {
  return expr[0] === 'ident' && expr[1];
};

const showVar = function (directive, controls, frames, context) {
  const {byPos} = directive;
  const frame = frames[0];
  const localMap = frame.get('localMap');
  const name = getIdent(byPos[0]);
  if (!localMap.has(name)) {
    return <p>{name}{" not in scope"}</p>;
  }
  const {type, ref} = localMap.get(name);
  const decl = viewVariable(context.core, name, type, ref.address);
  return <VarDecl {...decl} />;
};

const showArray = function (directive, controls, frames, context) {
  const {core} = context;
  // 'name' is the first positional argument
  const {byName, byPos} = directive;
  const {cursors} = byName;
  const name = getIdent(byPos[0]);
  // Use the topmost frame.
  const frame = frames[0];
  const localMap = frame.get('localMap');
  if (!localMap.has(name)) {
    return <p>{name}{" not in scope"}</p>;
  }
  const {type, ref} = localMap.get(name);
  // Expect an array declaration.
  if (type.kind !== 'array') {
    return <p>{"value is not an array"}</p>;
  }
  // Inspect cursors.
  const cursorDecls = [];
  if ('list' === cursors[0]) {
    cursors[1].forEach(function (cursor) {
      const name = getIdent(cursor);
      if (localMap.has(name)) {
        const {type, ref} = localMap.get(name);
        const decl = viewVariable(core, name, type, ref.address);
        cursorDecls.push(decl);
      }
    });
  }
  const address = ref.address;
  const elemType = type.elem;
  const elemCount = type.count.toInteger();
  const {cells} = readArrayWithCursors(
    core, pointerType(elemType), elemCount, address, cursorDecls);
  return <Array1DSvg cells={cells}/>
};

export default function* (deps) {

  yield defineSelector('DirectivesPaneSelector', function (state, props) {
    return {state: state.getIn(['stepper', 'display'])};
  });

  yield defineView('DirectivesPane', 'DirectivesPaneSelector', EpicComponent(self => {

    const directiveViewDict = {showVar, showArray};

    const collectDirectives = function (frames, focusDepth) {
      const dirOrder = [];
      const dirFrames = {};
      // Frames are collected in reverse order, so that the directive's render
      // function should use frames[0] to access the innermost frame.
      for (let depth = frames.size - 1 - focusDepth; depth >= 0; depth -= 1) {
        const frame = frames.get(depth);
        const directives = frame.get('directives');
        directives.forEach(function (directive) {
          const {key} = directive;
          if (key in dirFrames) {
            dirFrames[key].push(frame);
          } else {
            dirOrder.push(directive);
            dirFrames[key] = [frame];
          }
        })
      }
      return {dirOrder, dirFrames};
    };

    self.render = function () {
      const {state} = self.props;
      if (!state || !state.analysis) {
        return false;
      }
      const {core, analysis, controls} = state;
      // Traverse all stack frames to collect directive instances.
      const focusDepth = controls.getIn(['stack', 'focusDepth'], 0);
      const {dirOrder, dirFrames} = collectDirectives(analysis.frames, focusDepth);
      const context = {core};
      const renderDirective = function (directive, frames) {
        const {key, kind} = directive;
        const func = directiveViewDict[kind];
        return (
          <div key={key} className='directive-view clearfix'>
            {typeof func === 'function'
              ? <Panel className="directive" header={key}>
                  {func(directive, controls.get(key), frames, context)}
                </Panel>
              : <Panel header={`undefined view kind ${kind}`}/>}
          </div>
        );
      };
      return (
        <div className='directive-pane'>
          {dirOrder.map(directive => renderDirective(directive, dirFrames[directive.key]))}
        </div>
      );
    };

  }));

};
