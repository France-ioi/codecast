import React, { useEffect } from "react";
import {useAppSelector} from "../../hooks";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_librairies";
import {select} from "typed-redux-saga";
import {extractLevelSpecific} from "../../task/utils";

export const BlocklyEditor = () => {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);

    const context = quickAlgoLibraries.getContext(null, 'main');

    const onLoad = () => {

        if (!currentTask || !context) {
            return;
        }

        // TODO
        window.quickAlgoInterface = {
            displayCapacity: () => {},
            onEditorChange: (a, b) => console.log('on editor change', a, b),
            resetTestScores: () => {},
            displayError: (e) => {
                if (e) {
                    console.error(e);
                }
            },
            setPlayPause: () => {},
            updateControlsDisplay: () => {},
        };

        console.log('[blockly.editor] load blocky helper');
        const blocklyHelper = window.getBlocklyHelper(currentTask, context);
        context.blocklyHelper = blocklyHelper;
        context.onChange = (a, b) => {
            console.log('on change', a, b);
        };



        console.log('[blockly.editor] load context into blockly editor');
        blocklyHelper.loadContext(context);

        const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, currentLevel);
        blocklyHelper.setIncludeBlocks(curIncludeBlocks);

//         const blocklyOptions = {
//             readOnly: !!subTask.taskParams.readOnly,
//             defaultCode: subTask.defaultCode,
//             maxListSize: this.context.infos.maxListSize,
//             startingExample: this.context.infos.startingExample,
//             placeholderBlocks: !!(this.context.placeholderBlocks || this.context.infos.placeholderBlocks)
//         };
//
//         // Handle zoom options
//         var maxInstructions = this.context.infos.maxInstructions ? this.context.infos.maxInstructions : Infinity;
//         var zoomOptions = {
//             controls: false,
//             scale: maxInstructions > 20 ? 1 : 1.1
//         };
//         if(this.context.infos && this.context.infos.zoom) {
//             zoomOptions.controls = !!this.context.infos.zoom.controls;
//             zoomOptions.scale = (typeof this.context.infos.zoom.scale != 'undefined') ? this.context.infos.zoom.scale : zoomOptions.scale;
//         }
//         blocklyOptions.zoom = zoomOptions;
//
//         // Handle scroll
// //      blocklyOptions.scrollbars = maxInstructions > 10;
//         blocklyOptions.scrollbars = true;
//         if(typeof this.context.infos.scrollbars != 'undefined') {
//             blocklyOptions.scrollbars = this.context.infos.scrollbars;
//         }

        console.log('[blockly.editor] load blockly editor');
        blocklyHelper.load('fr', true, 1, {});
    }

    useEffect(() => {
        onLoad();
    }, [currentTask, context])

    return (
        <div className="blockly-editor">
            <div id='blocklyContainer'>
                <div id='blocklyDiv' className='language_blockly'/>
                <textarea id='program' className='language_javascript' style={{width: '100%', height: '100%', display: 'none'}}/>
            </div>
        </div>
    );
}
