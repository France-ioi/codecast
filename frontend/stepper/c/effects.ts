/*

  Effects API and programState effects.

  A call to C.step(programState) returns a list of effects.
  An effect is an array whose first element is a (string) name.
  An effect handler is a generator function that takes a stepper context and
  the effect's arguments.
  An effect handler mutates the stepper context (keeping in mind the stepper
  state is a persistent data structure and must not be mutated) to implement
  the effect.
  An effect handler can also yield further effects.
  In particular, the special 'interact' effect allows pausing the stepper when
  execution is blocked waiting for user interaction occurs or asyncronous I/O.

*/

import * as C from 'persistent-c';
import {StepperContext} from "../api";
import {Bundle} from "../../linker";
import {App} from "../../index";

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.onEffect('control', function* controlHandler(stepperContext: StepperContext, control) {
            C.effects.doControl(stepperContext.state.programState, control);
        });

        stepperApi.onEffect('result', function* resultHandler(stepperContext: StepperContext, result) {
            C.effects.doResult(stepperContext.state.programState, result);
        });

        stepperApi.onEffect('load', function* loadHandler(stepperContext: StepperContext, ref) {
            C.effects.doLoad(stepperContext.state.programState, ref);
        });

        stepperApi.onEffect('store', function* storeHandler(stepperContext: StepperContext, ref, value) {
            C.effects.doStore(stepperContext.state.programState, ref, value);
        });

        stepperApi.onEffect('enter', function* enterHandler(stepperContext: StepperContext, blockNode) {
            C.effects.doEnter(stepperContext.state.programState, blockNode);
            stepperContext.state.programState.scope.directives = blockNode[1].directives || [];
        });

        stepperApi.onEffect('leave', function* leaveHandler(stepperContext: StepperContext, blockNode) {
            C.effects.doLeave(stepperContext.state.programState, blockNode);
        });

        stepperApi.onEffect('call', function* callHandler(stepperContext: StepperContext, cont, values) {
            C.effects.doCall(stepperContext.state.programState, cont, values);

            /* XXX disable this code and leave directives in block */
            const bodyNode = values[0].decl;
            stepperContext.state.programState.scope.directives = bodyNode[1].directives || [];
            /* --- */
        });

        stepperApi.onEffect('return', function* returnHandler(stepperContext: StepperContext, result) {
            C.effects.doReturn(stepperContext.state.programState, result);
        });

        stepperApi.onEffect('vardecl', function* vardeclHandler(stepperContext: StepperContext, name, type, init) {
            C.effects.doVardecl(stepperContext.state.programState, name, type, init);
        });
    });
};
