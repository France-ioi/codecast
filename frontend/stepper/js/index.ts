import {AppStore, CodecastPlatform} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App, Codecast} from "../../index";
import {quickAlgoLibraries, QuickAlgoLibrary} from "../../task/libs/quickalgo_librairies";
import {selectAnswer} from "../../task/selectors";
import {getContextBlocksDataSelector} from "../../task/blocks/blocks";
import {TaskLevelName} from "../../task/platform/platform_slice";
import {extractLevelSpecific} from "../../task/utils";

export function* loadBlocklyHelperSaga(context: QuickAlgoLibrary, currentLevel: TaskLevelName) {
    let blocklyHelper;

    window.Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
    window.Blockly.JavaScript.addReservedWords('highlightBlock');

    window.quickAlgoInterface = {
        displayCapacity: () => {},
        onEditorChange: () => {}, // will be overriden in BlocklyEditor
        resetTestScores: () => {},
        displayError: (e) => {
            if (e) {
                console.error(e);
            }
        },
        setPlayPause: () => {},
        updateControlsDisplay: () => {},
        onResize: () => {},
    };

    console.log('[blockly.editor] load blocky helper');
    blocklyHelper = window.getBlocklyHelper(context.infos.maxInstructions, context);
    context.blocklyHelper = blocklyHelper;
    context.onChange = () => {};

    console.log('[blockly.editor] load context into blockly editor');
    blocklyHelper.loadContext(context);

    const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, currentLevel);
    blocklyHelper.setIncludeBlocks(curIncludeBlocks);
}

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

                const blocksData = getContextBlocksDataSelector(state, context);

                const blocklyInterpreter = Codecast.runner;
                blocklyInterpreter.initCodes(codes, blocksData);
            }
        });
    })
};
