import React, { useEffect } from "react";
import {getBlocklyHelper} from "./blockly";
import {useAppSelector} from "../../hooks";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_librairies";

export const BlocklyEditor = () => {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const context = quickAlgoLibraries.getContext(null, 'main');

    const onLoad = () => {

        if (!currentTask || !context) {
            return;
        }

        console.log('load blocky helper');
        const blocklyHelper = getBlocklyHelper(currentTask, context);

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

        blocklyHelper.load('fr', true, 1, {});
    }

    useEffect(() => {
        onLoad();
    }, [currentTask, context])

    return (
        <div className="blockly-editor">
            Blockly editor

            <div id='blocklyContainer'>
                <div id='blocklyDiv' className='language_blockly'/>
                <textarea id='program' className='language_javascript' style={{width: '100%', height: '100%', display: 'none'}}/>
            </div>
        </div>
    );
}
