import React, {useEffect, useRef} from "react";
import {useAppSelector} from "../../hooks";
import {BlockBufferHandler, documentToString} from "../../buffers/document";
import log from 'loglevel';
import {stepperDisplayError} from '../actionTypes';
import {useDispatch} from 'react-redux';
import {getMessage} from '../../lang';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {BlockBufferState, BlockDocument} from '../../buffers/buffer_types';

export interface BlocklyEditorProps {
    state?: BlockBufferState,
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
    const dispatch = useDispatch();

    const reset = (document: BlockDocument, selection, firstVisibleRow, alreadyReset = false) => {
        if (!context?.blocklyHelper) {
            return;
        }

        log.getLogger('editor').debug('[blockly.editor] reset', document);

        // if (null === value || null === documentGetContent(value)) {
        if (null === document) {
            let defaultBlockly = context.blocklyHelper.getDefaultContent();
            log.getLogger('editor').debug('get default', defaultBlockly);
            context.blocklyHelper.programs = [{javascript:"", blockly: defaultBlockly, blocklyJS: ""}];
            context.blocklyHelper.languages[0] = "blockly";
        } else {
            context.blocklyHelper.programs[0].blockly = document.content.blockly;
            context.blocklyHelper.languages[0] = "blockly";
        }

        log.getLogger('editor').debug('imported content', context.blocklyHelper.programs[0].blockly);
        context.blocklyHelper.reloading = true;
        context.blocklyHelper.loadPrograms();

        // Check that all blocks exist and program is valid. Otherwise, reload default answer and cancel
        try {
            context.blocklyHelper.programs[0].blocklyJS = context.blocklyHelper.getCode("javascript");
        } catch (e) {
            console.error(e);
            if (!alreadyReset) {
                reset(null, selection, firstVisibleRow, true);
                dispatch(stepperDisplayError(getMessage('EDITOR_RELOAD_IMPOSSIBLE')));
            }
        }
    };

    const highlight = (range) => {
        log.getLogger('editor').debug('[blockly.editor] highlight', range);
        if (!context?.blocklyHelper?.workspace) {
            return;
        }
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
        log.getLogger('editor').debug('[blockly.editor] resize');
    };

    const onBlocklyEvent = (event) => {
        log.getLogger('editor').debug('blockly event', event);
        const eventType = event ? event.constructor : null;

        let isBlockEvent = event ? (
            eventType === window.Blockly.Events.Create ||
            eventType === window.Blockly.Events.Delete ||
            eventType === window.Blockly.Events.Move ||
            eventType === window.Blockly.Events.Change) : true;

        if ('selected' === event.element) {
            log.getLogger('editor').debug('is selected');
            props.onSelect(event.newValue);
        }

        if (isBlockEvent) {
            const blocklyHelper = context.blocklyHelper;
            log.getLogger('editor').debug('on editor change');
            if (blocklyHelper.languages && blocklyHelper.languages.length && loaded.current && !blocklyHelper.reloading) {
                blocklyHelper.savePrograms();
                const answer = {...blocklyHelper.programs[0]};
                if (answer.blockly !== previousValue.current) {
                    const document = BlockBufferHandler.documentFromObject(answer);
                    previousValue.current = answer.blockly;
                    log.getLogger('editor').debug('new value', answer);
                    props.onEditPlain(document);
                    log.getLogger('editor').debug('timeout before removing highlight');
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
    };

    const onLoad = () => {
        if (!currentTask || !context || !context.blocklyHelper) {
            log.getLogger('editor').debug('[blockly.editor] load no data');
            return;
        }

        log.getLogger('editor').debug('[blockly.editor] load with data', context.infos.includeBlocks);
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
            wheel: false,
            scale: maxInstructions > 20 ? 1 : 1.1
        };
        if (context.infos && context.infos.zoom) {
            zoomOptions.controls = !!context.infos.zoom.controls;
            zoomOptions.wheel = !!context.infos.zoom.wheel;
            zoomOptions.scale = (typeof context.infos.zoom.scale != 'undefined') ? context.infos.zoom.scale : zoomOptions.scale;
        }
        blocklyOptions.zoom = zoomOptions;

        // Handle scroll
        blocklyOptions.scrollbars = maxInstructions > 10;
        if(typeof context.infos.scrollbars != 'undefined') {
            blocklyOptions.scrollbars = context.infos.scrollbars;
        }

        log.getLogger('editor').debug('[blockly.editor] load blockly editor', blocklyHelper, blocklyHelper.load);
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
            };
            props.onInit(api);
        }

        const treeRows = document.getElementsByClassName('blocklyTreeRow');
        for (let treeRow of treeRows) {
            // @ts-ignore
            const color = treeRow.style.borderLeftColor;
            // @ts-ignore
            treeRow.style.setProperty('--color', color);
        }

        loaded.current = true;
    }

    useEffect(() => {
        onLoad();

        return () => {
            log.getLogger('editor').debug('[blockly.editor] unload');

            if (context && context.blocklyHelper) {
                context.blocklyHelper.unloadLevel();
            }
        };
    }, [currentTask, currentLevel, contextId]);

    useEffect(() => {
        const newDocument = props.state?.document ?? null;
        // if (value === editor.current.getSession().getValue()) {
        //     return;
        // }

        reset(newDocument, props.state?.selection, props.state?.firstVisibleRow);
    }, [props.state?.document]);

    useEffect(() => {
        highlight(props.state?.highlight);
    }, [props.state?.highlight]);

    useEffect(() => {
        if (0 < props.state?.actions?.resize) {
            resize();
            return;
        }
    }, [props.state?.actions?.resize]);

    const groupsCategory = !!(context && context.infos && context.infos.includeBlocks && context.infos.includeBlocks.groupByCategory);

    return (
        <div className={`blockly-editor ${groupsCategory ? 'group-by-category' : ''}`}>
            <div id='blocklyContainer'>
                <div id='blocklyDiv' className='language_blockly'/>
                <textarea id='program' className='language_javascript' style={{width: '100%', height: '100%', display: 'none'}}/>
            </div>
        </div>
    );
}
