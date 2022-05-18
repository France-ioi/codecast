import React, {useEffect, useRef} from "react";
import {useAppSelector} from "../../hooks";
import {quickAlgoLibraries} from "../../task/libs/quickalgo_libraries";
import {ObjectDocument} from "../../buffers/document";
import {BlockDocumentModel} from "../../buffers";
import {ActionTypes} from "../../buffers/actionTypes";

export interface BlocklyEditorProps {
    onInit: Function,
    onEditPlain: Function,
    onSelect: Function,
}

export const BlocklyEditor = (props: BlocklyEditorProps) => {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const contextId = useAppSelector(state => state.task.contextId);
    const language = useAppSelector(state => state.options.language.split('-')[0]);

    const context = quickAlgoLibraries.getContext(null, 'main');
    const previousValue = useRef(null);
    const loaded = useRef(false);
    const resetDisplayTimeout = useRef(null);

    const reset = (value, selection, firstVisibleRow) => {
        console.log('[blockly.editor] reset', value);

        if (null === value.getContent()) {
            let defaultBlockly = context.blocklyHelper.getDefaultContent();
            console.log('get default', defaultBlockly);
            context.blocklyHelper.programs = [{javascript:"", blockly: defaultBlockly, blocklyJS: ""}];
            context.blocklyHelper.languages[0] = "blockly";
        } else {
            context.blocklyHelper.programs[0].blockly = value.getContent().blockly;
            context.blocklyHelper.languages[0] = "blockly";
        }

        console.log('imported content', context.blocklyHelper.programs[0].blockly);
        context.blocklyHelper.reloading = true;
        context.blocklyHelper.loadPrograms();
        setTimeout(() => {
            context.blocklyHelper.reloading = false;
            console.log('end reloading');
        });
    };

    const highlight = (range) => {
        console.log('[blockly.editor] highlight', range);
        // Fix of a code in blockly_interface.js making double consecutive highlight for the same block not working
        if (null !== range) {
            window.Blockly.selected = null;
        }

        try {
            context.blocklyHelper.highlightBlock(range);
        } catch (e) {
            console.error(e);
        }
    };

    const resize = () => {
        console.log('[blockly.editor] resize');
    };

    const onBlocklyEvent = (event) => {
        console.log('blockly event', event);
        const eventType = event ? event.constructor : null;

        let isBlockEvent = event ? (
            eventType === window.Blockly.Events.Create ||
            eventType === window.Blockly.Events.Delete ||
            eventType === window.Blockly.Events.Move ||
            eventType === window.Blockly.Events.Change) : true;

        if ('selected' === event.element) {
            console.log('is selected');
            props.onSelect(event.newValue);
        }

        if (isBlockEvent) {
            const blocklyHelper = context.blocklyHelper;
            console.log('on editor change');
            if (blocklyHelper.languages && blocklyHelper.languages.length && loaded.current && !blocklyHelper.reloading) {
                blocklyHelper.savePrograms();
                const answer = {...blocklyHelper.programs[0]};
                if (answer.blockly !== previousValue.current) {
                    const document = new ObjectDocument(answer);
                    previousValue.current = answer.blockly;
                    console.log('new value', answer);
                    props.onEditPlain(document);
                    if (!blocklyHelper.reloading) {
                        console.log('timeout before removing highlight');
                        if (resetDisplayTimeout.current) {
                            clearTimeout(resetDisplayTimeout.current);
                            resetDisplayTimeout.current = null;
                        }
                        resetDisplayTimeout.current = setTimeout(() => {
                            blocklyHelper.onChangeResetDisplayFct();
                        }, 500);
                    }
                }
            }
        }
    };

    const onLoad = () => {
        if (!currentTask || !context) {
            console.log('[blockly.editor] load no data');
            return;
        }

        console.log('[blockly.editor] load with data', context.infos.includeBlocks);
        const blocklyHelper = context.blocklyHelper;

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
        blocklyHelper.load(language, true, 1, blocklyOptions);

        blocklyHelper.workspace.addChangeListener(onBlocklyEvent);

        if (typeof props.onInit === 'function') {
            const api = {
                reset,
                // applyDeltas,
                setSelection: highlight,
                // focus,
                // scrollToLine,
                // getSelectionRange,
                highlight,
                resize,
                // goToEnd,
                // insert,
                // insertSnippet,
                getEmptyModel() {
                    return new BlockDocumentModel();
                },
            };
            props.onInit(api);
        }

        loaded.current = true;
    }

    useEffect(() => {
        onLoad();

        return () => {
            console.log('[blockly.editor] unload');

            if (context && context.blocklyHelper) {
                context.blocklyHelper.unloadLevel();
            }
        };
    }, [currentTask, currentLevel, contextId]);

    return (
        <div className="blockly-editor">
            <div id='blocklyContainer'>
                <div id='blocklyDiv' className='language_blockly'/>
                <textarea id='program' className='language_javascript' style={{width: '100%', height: '100%', display: 'none'}}/>
            </div>
        </div>
    );
}
