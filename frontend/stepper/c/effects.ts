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

import * as C from '@france-ioi/persistent-c';
import {StepperContext} from "../api";
import {Bundle} from "../../linker";
import produce from "immer";
import {App} from '../../app_types';

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.onEffect('control', function* controlHandler(stepperContext: StepperContext, control) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doControl(draft, control);
            })
        });

        stepperApi.onEffect('result', function* resultHandler(stepperContext: StepperContext, result) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doResult(draft, result);
            });
        });

        stepperApi.onEffect('load', function* loadHandler(stepperContext: StepperContext, ref) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doLoad(draft, ref);
            });
        });

        stepperApi.onEffect('store', function* storeHandler(stepperContext: StepperContext, ref, value) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doStore(draft, ref, value);
            });
        });

        stepperApi.onEffect('enter', function* enterHandler(stepperContext: StepperContext, blockNode) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doEnter(draft, blockNode);
                draft.scope.directives = blockNode[1].directives || [];
            });
        });

        stepperApi.onEffect('leave', function* leaveHandler(stepperContext: StepperContext, blockNode) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doLeave(draft, blockNode);
            });
        });

        stepperApi.onEffect('call', function* callHandler(stepperContext: StepperContext, cont, values) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doCall(draft, cont, values);

                /* XXX disable this code and leave directives in block */
                const bodyNode = values[0].decl;
                draft.scope.directives = bodyNode[1].directives || [];
                /* --- */
            });
        });

        stepperApi.onEffect('return', function* returnHandler(stepperContext: StepperContext, result) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doReturn(draft, result);
            });
        });

        stepperApi.onEffect('vardecl', function* vardeclHandler(stepperContext: StepperContext, name, type, init) {
            stepperContext.state.programState = produce(stepperContext.state.programState, (draft) => {
                C.effects.doVardecl(draft, name, type, init);
            });
        });
    });
};
