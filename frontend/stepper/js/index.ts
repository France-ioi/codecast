import {AppStore, CodecastPlatform} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App, Codecast} from "../../index";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_librairies";
import {selectAnswer} from "../../task/selectors";

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.onInit(function(stepperState: StepperState, state: AppStore, environment: string) {
            const {platform} = state.options;
            const codes = selectAnswer(state);
            const context = quickAlgoLibraries.getContext(null, environment);

            console.log('init stepper', environment);
            if (platform === CodecastPlatform.Blockly) {
                context.onError = (diagnostics) => {
                    console.log('context error', diagnostics);
                    // channel.put({
                    //     type: CompileActionTypes.StepperInterrupting,
                    // });
                    // channel.put(stepperExecutionError(diagnostics));
                };
                context.onSuccess = () => {
                    console.error('Success should be handled at an upper level');
                };
                context.onInput = () => {
                    console.error('Input should go to the printer lib');
                }

                const blocklyInterpreter = Codecast.runner;
                blocklyInterpreter.initCodes(codes);
            }
        });
    })
};
