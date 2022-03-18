import React, { useEffect } from "react";
import {useAppSelector} from "../../hooks";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_librairies";
import {extractLevelSpecific} from "../../task/utils";
import {useDispatch} from "react-redux";
import {platformSaveAnswer} from "../../task/platform/platform_slice";

export const BlocklyEditor = () => {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);

    const context = quickAlgoLibraries.getContext(null, 'main');

    const dispatch = useDispatch();

    const onLoad = () => {
        if (!currentTask || !context) {
            return;
        }

        let blocklyHelper;

        // TODO
        window.quickAlgoInterface = {
            displayCapacity: () => {},
            onEditorChange: (a, b) => {
                console.log('on editor change', a, b, blocklyHelper.languages);
                if (blocklyHelper.languages && blocklyHelper.languages.length) {
                    blocklyHelper.savePrograms();
                    const answer = blocklyHelper.getAllCodes();
                    console.log('new value', answer);
                    dispatch(platformSaveAnswer({level: currentLevel, answer}));
                }
            },
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

        console.log('[blockly.editor] load blocky helper', currentTask);
        blocklyHelper = window.getBlocklyHelper(context.infos.maxInstructions, context);
        context.blocklyHelper = blocklyHelper;
        context.onChange = (a, b) => {
            // console.log('on change', a, b);
        };

        console.log('[blockly.editor] load context into blockly editor');
        blocklyHelper.loadContext(context);

        const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, currentLevel);
        blocklyHelper.setIncludeBlocks(curIncludeBlocks);

        const blocklyOptions = {
            // readOnly: !!subTask.taskParams.readOnly,
            // defaultCode: subTask.defaultCode,
            maxListSize: context.infos.maxListSize,
            startingExample: context.infos.startingExample,
            placeholderBlocks: !!(context.placeholderBlocks || context.infos.placeholderBlocks),
            zoom: null,
            scrollbars: false,
        };

        // Handle zoom options
        let maxInstructions = context.infos.maxInstructions ? context.infos.maxInstructions : Infinity;
        let zoomOptions = {
            controls: false,
            scale: maxInstructions > 20 ? 1 : 1.1
        };
        if (context.infos && context.infos.zoom) {
            zoomOptions.controls = !!context.infos.zoom.controls;
            zoomOptions.scale = (typeof context.infos.zoom.scale != 'undefined') ? context.infos.zoom.scale : zoomOptions.scale;
        }
        blocklyOptions.zoom = zoomOptions;

        // Handle scroll
        blocklyOptions.scrollbars = maxInstructions > 10;
        if(typeof context.infos.scrollbars != 'undefined') {
            blocklyOptions.scrollbars = context.infos.scrollbars;
        }

        console.log('[blockly.editor] load blockly editor');
        //TODO: handle i18n
        blocklyHelper.load('fr', true, 1, blocklyOptions);
    }

    useEffect(() => {
        onLoad();
    }, [currentTask, context, currentLevel]);

    return (
        <div className="blockly-editor">
            <div id='blocklyContainer'>
                <div id='blocklyDiv' className='language_blockly'/>
                <textarea id='program' className='language_javascript' style={{width: '100%', height: '100%', display: 'none'}}/>
            </div>
        </div>
    );
}
