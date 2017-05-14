/*

  Effects API and core effects.

  A call to C.step(core) returns a list of effects.
  An effect is an array whose first element is a (string) name.
  An effect handler is a saga that takes a context and the effect's arguments.

*/

import * as C from 'persistent-c';
import {put} from 'redux-saga/effects';

export default function (bundle, deps) {

  bundle.use('stepperProgress');

  bundle.defer(function ({stepperApi}) {

    stepperApi.onEffect('control', function* controlHandler (context, control) {
      C.effects.doControl(context.state.core, control);
    });

    stepperApi.onEffect('result', function* resultHandler (context, result) {
      C.effects.doResult(context.state.core, result);
    });

    stepperApi.onEffect('load', function* loadHandler (context, ref) {
      C.effects.doLoad(context.state.core, ref);
    });

    stepperApi.onEffect('store', function* storeHandler (context, ref, value) {
      C.effects.doStore(context.state.core, ref, value);
    });

    stepperApi.onEffect('enter', function* enterHandler (context, blockNode) {
      C.effects.doEnter(context.state.core, blockNode);
      context.state.core.scope.directives = blockNode[1].directives || [];
    });

    stepperApi.onEffect('leave', function* leaveHandler (context, blockNode) {
      C.effects.doLeave(context.state.core, blockNode);
    });

    stepperApi.onEffect('call', function* callHandler (context, cont, values) {
      C.effects.doCall(context.state.core, cont, values);
      /* XXX disable this code and leave directives in block */
      const bodyNode = values[0].decl;
      context.state.core.scope.directives = bodyNode[1].directives || [];
      /* --- */
    });

    stepperApi.onEffect('return', function* returnHandler (context, result) {
      C.effects.doReturn(context.state.core, result);
    });

    stepperApi.onEffect('vardecl', function* vardeclHandler (context, name, type, init) {
      C.effects.doVardecl(context.state.core, name, type, init);
    });

    stepperApi.onEffect('progress', function* progressHandler (context) {
      yield put({type: deps.stepperProgress, context});
    });

    stepperApi.onEffect('builtin', stepperApi.runBuiltin);

  });

};
