import React from 'react';
import * as C from 'persistent-c';
import {StepperControls} from "./views/StepperControls";

export default function (bundle, deps) {
    bundle.use(
        'getStepper',
        'getStepperOptions',
        'stepperStep',
        'stepperInterrupt',
        'stepperRestart',
        'stepperExit',
        'stepperUndo',
        'stepperRedo',
        'compile',
        'isStepperInterrupting'
    );

    function StepperControlsSelector(state, props) {
        const {enabled} = props;
        const getMessage = state.get('getMessage');
        const {controls, showStepper, platform} = state.get('options');

        let showCompile = false, showControls = false, showEdit = false;
        let canCompile = false, canExit = false, canRestart = false, canStep = false, canStepOut = false;
        let canInterrupt = false, canUndo = false, canRedo = false;
        let showExpr = true;
        let compileOrExecuteMessage = '';

        if (platform === 'python') {
            compileOrExecuteMessage = getMessage('EXECUTE');
        } else {
            compileOrExecuteMessage = getMessage('COMPILE');
        }

        const stepper = deps.getStepper(state);
        if (stepper) {
            const status = stepper.get('status');
            if (status === 'clear') {
                showCompile = true;
                canCompile = enabled;
            } else if (status === 'idle') {
                const currentStepperState = stepper.get('currentStepperState', {});

                showEdit = true;
                showControls = true;
                canExit = enabled;

                if (platform === 'python') {
                    // We can step out only if we are in >= 2 levels of functions (the global state + in a function).
                    canStepOut = (currentStepperState.suspensions && (currentStepperState.suspensions.length > 1));
                    canStep = !currentStepperState.analysis.isFinished;
                    canRestart = enabled;
                    canUndo = enabled && !stepper.get('undo').isEmpty();
                    canRedo = enabled && !stepper.get('redo').isEmpty();
                    showExpr = false;
                } else {
                    if (currentStepperState && currentStepperState.programState) {
                        const {control, scope} = currentStepperState.programState;
                        canStepOut = !!C.findClosestFunctionScope(scope);
                        canStep = control && !!control.node;
                        canRestart = enabled;
                        canUndo = enabled && !stepper.get('undo').isEmpty();
                        canRedo = enabled && !stepper.get('redo').isEmpty();
                    }
                }
            } else if (status === 'starting') {
                showEdit = true;
                showControls = true;
            } else if (status === 'running') {
                showEdit = true;
                showControls = true;
                canInterrupt = enabled && !deps.isStepperInterrupting(state);
            }
        }

        const result = {
            getMessage,
            showStepper, showControls, controls,
            showEdit, canExit,
            showExpr,
            showCompile, canCompile,
            canRestart, canStep, canStepOut, canInterrupt,
            canUndo, canRedo,
            compileOrExecuteMessage
        };

        return result;
    }

    bundle.defineView('StepperControls', StepperControlsSelector, StepperControls);
};
