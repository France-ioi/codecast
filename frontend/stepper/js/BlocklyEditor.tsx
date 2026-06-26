import React, {useEffect, useRef} from "react";
import {useAppSelector} from "../../hooks";
import {BlockBufferHandler, documentToString} from "../../buffers/document";
import log from 'loglevel';
import {stepperDisplayError} from '../actionTypes';
import {useDispatch} from 'react-redux';
import {quickAlgoLibraries} from '../../task/libs/quick_algo_libraries_model';
import {BlockBufferState, BlockDocument} from '../../buffers/buffer_types';
import {bufferResetToDefaultSourceCode} from '../../buffers/buffer_actions';
import {ComputedSourceHighlight, SourceHighlightBlock} from '../index';
import {callPlatformLog} from '../../submission/submission_actions';
import {selectGroupByCategory} from './index';
import {selectActiveView} from '../../task/layout/layout';
import {getMessage} from '../../lang/messages';
import * as Blockly from 'blockly/core';
import {BlockSvg} from 'blockly/core';
import {CodecastPlatform} from '../codecast_platform';
import {BlocklyProgram} from './blockly_helper';

export interface BlocklyEditorProps {
    name?: string,
    highlights?: ComputedSourceHighlight[]|null,
    state?: BlockBufferState,
    onInit: Function,
    onEditPlain: Function,
    onSelect: Function,
    readOnly?: boolean,
}

export const BlocklyEditor = (props: BlocklyEditorProps) => {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const contextId = useAppSelector(state => state.task.contextId);
    const language = useAppSelector(state => state.options.language.split('-')[0]);
    const contextIncludeBlocks = useAppSelector(state => state.task.contextIncludeBlocks);
    const groupByCategory = useAppSelector(selectGroupByCategory);
    const activeView = useAppSelector(selectActiveView);

    const context = quickAlgoLibraries.getContext(null, 'main');
    const currentValue = useRef(null);
    const previousValue = useRef(null);
    const highlightedBlocks = useRef<{[className: string]: string[]}>({});
    const selectedBlockId = useRef<string>(null);
    const loaded = useRef(false);
    const continuousToolbox = CodecastPlatform.Scratch === props.state?.platform && groupByCategory;
    const dispatch = useDispatch();

    log.getLogger('editor').debug('[buffer] re-render editor', {name: props.name, state: props.state, highlights: props.highlights});

    const reset = (document: BlockDocument) => {
        if (!context?.blocklyHelper) {
            return;
        }

        log.getLogger('editor').debug('[blockly.editor] reset', document);

        let program: BlocklyProgram;
        if (!document || null === document.content) {
            let defaultBlockly = context.blocklyHelper.getDefaultContent();
            log.getLogger('editor').debug('get default', defaultBlockly);
            program = {javascript: "", blockly: defaultBlockly, blocklyJS: "", blocklyPython: ""};
        } else {
            program = {javascript: "", blocklyJS: "", blocklyPython: "", ...document.content};
        }
        context.blocklyHelper.languages[0] = "blockly";

        log.getLogger('editor').debug('imported content', program.blockly);

        // Check that all blocks exist and program is valid. Otherwise, reload default answer and cancel
        try {
            previousValue.current = program.blockly;
            context.blocklyHelper.loadProgram(program);
            program.blocklyJS = context.blocklyHelper.getCode("javascript");
            if (0 === program.blocklyJS.trim().length) {
                throw new Error("The reloaded answer is empty");
            }
        } catch (e) {
            console.error(e);
            dispatch(bufferResetToDefaultSourceCode(props.name));
            dispatch(stepperDisplayError(getMessage('EDITOR_RELOAD_IMPOSSIBLE').s));
        }
    };

    const highlight = (blockId: string, className: string = 'blocklySelected', add: boolean = false) => {
        log.getLogger('editor').debug('[blockly.editor] highlight', blockId);
        if (!context?.blocklyHelper?.workspace) {
            return;
        }

        const workspace = context?.blocklyHelper?.workspace;

        try {
            if (!blockId) {
                add = false;
            }

            if (!add) {
                clearHighlights(className);
            }


            const block = workspace.getBlockById(blockId) as BlockSvg;
            if (block) {
                block.addClass(className);
            }

            if (null !== blockId) {
                if (!(className in highlightedBlocks.current)) {
                    highlightedBlocks.current[className] = [];
                }
                highlightedBlocks.current[className].push(blockId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const clearHighlights = (className: string) => {
        if (highlightedBlocks.current && className in highlightedBlocks.current) {
            const workspace = context?.blocklyHelper?.workspace;
            for (let blockId of highlightedBlocks.current[className]) {
                const block = workspace.getBlockById(blockId) as BlockSvg;
                if (block) {
                    block.removeClass(className);
                }
            }

            delete highlightedBlocks.current[className];
        }
    }

    const resize = () => {
        log.getLogger('editor').debug('[blockly.editor] resize');
        if (context && context.blocklyHelper) {
            context.blocklyHelper.unloadLevel();
        }
        onLoad();
    };

    const onBlocklyEvent = (event) => {
        log.getLogger('editor').debug('blockly event', event);

        if (Blockly.Events.SELECTED === event.type)     {
            if (event.newElementId !== selectedBlockId.current) {
                log.getLogger('editor').debug('is selected');
                selectedBlockId.current = event.newElementId;
                props.onSelect(event.newElementId);
            }
            return;
        }

        const isBlockEvent = [
            Blockly.Events.BLOCK_DRAG,
            Blockly.Events.BLOCK_MOVE,
            Blockly.Events.BLOCK_CREATE,
            Blockly.Events.BLOCK_CHANGE,
        ].includes(event.type);

        if (isBlockEvent) {
            const blocklyHelper = context.blocklyHelper;
            log.getLogger('editor').debug('on editor change', loaded.current, blocklyHelper.languages);
            if (blocklyHelper.languages && blocklyHelper.languages.length && loaded.current) {
                const answer = blocklyHelper.saveProgram();
                if (answer.blockly !== previousValue.current) {
                    const document = BlockBufferHandler.documentFromObject(answer);
                    previousValue.current = answer.blockly;
                    log.getLogger('editor').debug('new value', answer);
                    props.onEditPlain(document);

                    if (event.type !== Blockly.Events.BLOCK_CREATE && (event.type === Blockly.Events.BLOCK_CHANGE || event.oldCoordinate)) {
                        const details = `block_update;${event.type.prototype.type};${documentToString(document)}`;
                        dispatch(callPlatformLog(['activity', details], 'blocks'));
                    }

                    // log.getLogger('editor').debug('timeout before removing highlight');
                    // if (resetDisplayTimeout.current) {
                    //     clearTimeout(resetDisplayTimeout.current);
                    //     resetDisplayTimeout.current = null;
                    // }
                    // resetDisplayTimeout.current = setTimeout(() => {
                    //     blocklyHelper.onChangeResetDisplayFct();
                    // }, 2000);
                }
            }
        }
    };

    const onLoad = () => {
        if (!currentTask || !context || !context.blocklyHelper) {
            log.getLogger('editor').debug('[blockly.editor] load no data');
            return;
        }

        log.getLogger('editor').debug('[blockly.editor] load with data', contextIncludeBlocks);
        const blocklyHelper = context.blocklyHelper;

        const blocklyOptions = {
            // readOnly: !!subTask.taskParams.readOnly,
            // defaultCode: subTask.defaultCode,
            maxListSize: context.infos.maxListSize,
            startingExample: context.infos.startingExample,
            placeholderBlocks: !!(context.placeholderBlocks || context.infos.placeholderBlocks),
            zoom: null,
            scrollbars: false,
            readOnly: props.readOnly,
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

        log.getLogger('editor').debug('[blockly.editor] load blockly editor', blocklyHelper, blocklyHelper.load, props.state?.document);
        blocklyHelper.load(language, true, 1, blocklyOptions);

        blocklyHelper.workspace.addChangeListener(onBlocklyEvent);

        if (typeof props.onInit === 'function') {
            props.onInit();
        }

        const treeRows = document.getElementsByClassName('blocklyTreeRow');
        for (let treeRow of treeRows) {
            // @ts-ignore
            const color = treeRow.style.borderLeftColor;
            // @ts-ignore
            treeRow.style.setProperty('--color', color);
        }

        reset(props.state?.document);
        loaded.current = true;
    }

    useEffect(() => {
        console.log('change active view', activeView);

        onLoad();

        return () => {
            log.getLogger('editor').debug('[blockly.editor] unload');

            if (context && context.blocklyHelper) {
                context.blocklyHelper.unloadLevel();
            }
        };
    }, [currentTask, currentLevel, contextId, props.readOnly, activeView]);

    const updateDocumentConditionnally = () => {
        const newDocument = currentValue.current ?? BlockBufferHandler.getEmptyDocument();
        if (previousValue.current === newDocument?.content?.blockly) {
            log.getLogger('editor').debug('[blockly.editor] documents are identical');
            return;
        }

        log.getLogger('editor').debug('[blockly.editor] load document', {newDocument, previousValue: previousValue.current});

        reset(newDocument);
    };

    // const onLoadDocument = useDebounce(updateDocumentConditionnally, 100);

    useEffect(() => {
        log.getLogger('editor').debug('[blockly.editor] document has changed, check differences', {
            oldDocument: currentValue.current,
            newDocument: props.state?.document,
        });
        currentValue.current = props.state?.document;
        updateDocumentConditionnally();
        // onLoadDocument();
    }, [props.state?.document]);

    useEffect(() => {
        const highlights = props.highlights;
        log.getLogger('editor').debug('[blockly.editor] highlight changed', highlights, props, highlightedBlocks.current);

        clearHighlights('code-highlight');
        clearHighlights('other-thread-highlight');
        if (props.highlights) {
            let add = false;
            for (let highlightElement of props.highlights) {
                highlight((highlightElement.highlight as SourceHighlightBlock).blockId, highlightElement.className, add);
                add = true;
            }
        }
    }, [props.highlights]);

    // Don't reload selection in Scratch because in Scratch there is no notion of selection. You can only glow a block (which
    // corresponds to the highlight)
    useEffect(() => {
        const selection = props.state?.selection;
        log.getLogger('editor').debug('[blockly.editor] selection changed', selection, props, selectedBlockId.current);
        if (selection === selectedBlockId.current) {
            return;
        }

        const workspace = context?.blocklyHelper?.workspace;

        clearHighlights('blocklySelected');

        if (selection && workspace) {
            const block = workspace.getBlockById(selection) as BlockSvg;
            if (block) {
                block.select();
            }
        }
    }, [props.state?.selection]);

    useEffect(() => {
        if (0 < props.state?.actions?.resize) {
            resize();
            return;
        }
    }, [props.state?.actions?.resize]);

    return (
        <div className={`blockly-editor ${groupByCategory ? 'group-by-category' : ''} ${continuousToolbox ? 'blockly-continuous-toolbox' : ''}`}>
            <div id='blocklyContainer'>
                <div id='blocklyDiv' className='language_blockly'/>
                <textarea id='program' className='language_javascript' style={{width: '100%', height: '100%', display: 'none'}}/>
            </div>
        </div>
    );
}
