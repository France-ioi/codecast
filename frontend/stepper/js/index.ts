import {AppStore, CodecastPlatform} from "../../store";
import {StepperState} from "../index";
import {Bundle} from "../../linker";
import {App, Codecast} from "../../index";
import {quickAlgoLibraries, QuickAlgoLibrary} from "../../task/libs/quickalgo_librairies";
import {selectAnswer} from "../../task/selectors";
import {getContextBlocksDataSelector} from "../../task/blocks/blocks";
import {TaskLevelName} from "../../task/platform/platform_slice";
import {extractLevelSpecific} from "../../task/utils";
import {delay} from "../api";

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
        stepperApi.onInit(async function(stepperState: StepperState, state: AppStore, environment: string) {
            const {platform} = state.options;
            const answer = selectAnswer(state);
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

                const blocklyHelper = context.blocklyHelper;
                console.log('blockly helper', blocklyHelper);
                console.log('display', context.display);
                const blocklyXmlCode = answer.blockly;
                if (!blocklyHelper.workspace) {
                    blocklyHelper.load('fr', context.display, 1, {});
                }
                if (0 === blocklyHelper.programs.length) {
                    blocklyHelper.programs.push({});
                }
                blocklyHelper.programs[0].blockly = blocklyXmlCode;
                console.log('xml code', blocklyXmlCode);

                blocklyHelper.loadingPrograms = true;
                blocklyHelper.loadPrograms();
                // Wait that program is loaded (Blockly fires some event including an onChange event
                if ('main' === environment) {
                    await delay(0);
                }
                blocklyHelper.loadingPrograms = false;

                blocklyHelper.programs[0].blocklyJS = blocklyHelper.getCode("javascript");

                let code = blocklyHelper.getFullCode(blocklyHelper.programs[0].blocklyJS);

                const blocklyInterpreter = Codecast.runner;
                blocklyInterpreter.initCodes([code], blocksData);
            }
        });
    })
};
