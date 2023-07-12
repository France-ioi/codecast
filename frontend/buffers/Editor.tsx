import React, {useEffect, useRef, useState} from 'react';
import classnames from 'classnames';
import {addAutocompletion} from "./editorAutocompletion";
import {Document, TextBufferState} from './buffer_types';
import {getMessage} from "../lang";
import {DraggableBlockItem, getContextBlocksDataSelector} from "../task/blocks/blocks";
import {useAppSelector} from "../hooks";
import {useDrop} from "react-dnd";
import log from 'loglevel';
import {quickAlgoLibraries} from '../task/libs/quick_algo_libraries_model';
import {BlockType} from '../task/blocks/block_types';
import {bufferClearBlocksToInsert, bufferClearDeltasToApply} from './buffers_slice';
import {useDispatch} from 'react-redux';
import {documentToString} from './document';

const Range = window.ace.acequire('ace/range').Range;

export interface EditorProps {
    name?: string,
    state?: TextBufferState,
    readOnly?: boolean,
    shield?: boolean,
    theme?: string,
    mode?: string,
    width?: any,
    height?: any,
    hasAutocompletion?: boolean,
    hasScrollMargin?: boolean,
    onInit?: Function,
    onSelect?: Function,
    onEdit?: Function,
    onEditPlain?: Function,
    onScroll?: Function,
    onDropBlock?: Function,
    content?: string,
    errorHighlight?: Range,
    hideGutter?: boolean,
    showPrintMargin?: boolean,
    highlightActiveLine?: boolean,
    maxLines?: number,
    dragEnabled?: boolean,
    hideCursor?: boolean,
}

function toRange(selection) {
    return new Range(
        selection.start.row, selection.start.column,
        selection.end.row, selection.end.column
    );
}

function samePosition(p1, p2) {
    return p1 && p2 && p1.row == p2.row && p1.column == p2.column;
}

function sameSelection(s1, s2) {
    if (typeof s1 !== typeof s2 || !!s1 !== !!s2) {
        return false;
    }

    // Test for same object (and also null).
    if (s1 === s2) {
        return true;
    }

    return samePosition(s1.start, s2.start) && samePosition(s1.end, s2.end);
}

export function Editor(props: EditorProps) {
    const [scrollTop, setScrollTop] = useState(0);
    const [firstVisibleRow, setFirstVisibleRow] = useState(0);
    const [willUpdateSelection, setWillUpdateSelection] = useState(false);

    const editor = useRef(null);
    const mute = useRef(false);
    const selection = useRef(null);
    const marker = useRef();

    const dispatch = useDispatch();

    const context = quickAlgoLibraries.getContext(null, 'main');
    const availableBlocks = useAppSelector(state => context && 'text' !== props.mode ? getContextBlocksDataSelector({state, context}) : null);
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const contextStrings = useAppSelector(state => state.task.contextStrings);

    const refEditor = useRef();

    console.log('re-render editor', props.state);

    const scrollOnLastLines = () => {
        const ace = editor.current;
        const cursorDistanceToBottom = ace.renderer.$size.scrollerHeight + ace.renderer.session.getScrollTop() - ace.renderer.$cursorLayer.getPixelPosition().top;
        if (cursorDistanceToBottom < 120) {
            ace.renderer.session.setScrollTop(ace.renderer.session.getScrollTop() + 120 - cursorDistanceToBottom);
        }
    }

    /*
      Performance fix: Ace fires many redundant selection events, so we wait
      until the next animation frame before querying the selection and firing
      the onSelect callback.
    */
    const onSelectionChanged = () => {
        if (mute.current || willUpdateSelection) {
            return;
        }
        // const isUserChange = editor.curOp && editor.curOp.command.name;
        setWillUpdateSelection(true);
        window.requestAnimationFrame(() => {
            setWillUpdateSelection(false);
            const selection_ = editor.current.selection.getRange();
            if (sameSelection(selection.current, selection_))
                return;
            log.getLogger('editor').debug('new selection', selection.current, selection_);
            selection.current = selection_;
            if (props.onSelect) {
                props.onSelect(selection_);
            }
            if (props.hasScrollMargin) {
                // Try to scroll if needed
                scrollOnLastLines();
            }
        });
    };

    const onTextChanged = (edit) => {
        console.log('do edit', edit);
        if (mute.current || !props.onEdit) {
            return;
        }
        // The callback must not trigger a rendering of the Editor.
        props.onEdit(edit)
    };

    const onAfterRender = () => {
        if (mute.current) {
            return;
        }
        const scrollTop_ = editor.current.getSession().getScrollTop();
        if (scrollTop !== scrollTop_) {
            setScrollTop(scrollTop_);
            const {onScroll} = props;
            if (typeof onScroll === 'function') {
                const firstVisibleRow_ = editor.current.getFirstVisibleRow();
                if (firstVisibleRow !== firstVisibleRow_) {
                    setFirstVisibleRow(firstVisibleRow_);
                    onScroll(firstVisibleRow_);
                }
            }
        }
    };

    const wrapModelToEditor = (cb) => {
        if (!editor.current) {
            return;
        }
        mute.current = true;
        try {
            cb();
        } finally {
            mute.current = false;
        }
    };

    const reset = (value: Document, newSelection = null, firstVisibleRow = null) => {
        wrapModelToEditor(() => {
            // if (undefined !== props.content) {
            //     value = documentFromString(String(null !== props.content ? props.content : ''));
            // }

            editor.current.getSession().setValue(null === value ? '' : value.toString());
            editor.current.resize(true);
            selection.current = null;
            doSetSelection(newSelection);
            setFirstVisibleRow(firstVisibleRow);
            editor.current.scrollToLine(firstVisibleRow);
            setScrollTop(editor.current.getSession().getScrollTop());
            // Clear a previously set marker, if any.
            if (marker.current) {
                editor.current.session.removeMarker(marker.current);
                marker.current = null;
            }
        });
    };

    const applyDeltas = (deltas) => {
        wrapModelToEditor(() => {
            editor.current.session.doc.applyDeltas(deltas);
        });
    };

    const focus = () => {
        if (!editor.current) {
            return;
        }

        editor.current.focus();
    };

    const scrollToLine = (firstVisibleRow) => {
        wrapModelToEditor(() => {
            editor.current.resize(true);
            setFirstVisibleRow(firstVisibleRow);
            editor.current.scrollToLine(firstVisibleRow);
            setScrollTop(editor.current.getSession().getScrollTop());
        });
    };

    const goToEnd = () => {
        if (!editor.current) {
            return;
        }

        editor.current.gotoLine(Infinity, Infinity, false);
    }

    const insert = (text, pos = null, snippet = false, newLineBefore = false, newLineAfter = false) => {
        if (!editor.current) {
            return;
        }

        let cursorPosition = pos ? pos : editor.current.getCursorPosition();
        // const textAfter = editor.current.session.doc.getTextRange(new Range(cursorPosition.row, cursorPosition.column, Infinity, Infinity));
        const indentationCurrentLine = editor.current.session.doc.getLine(cursorPosition.row).search(/\S|$/);
        const textBeforeOnLine = editor.current.session.doc.getTextRange(new Range(cursorPosition.row, 0, cursorPosition.row, cursorPosition.column));
        const hasTextBeforeOnLine = textBeforeOnLine && textBeforeOnLine.trim().length;

        if (snippet) {
            if (hasTextBeforeOnLine && newLineBefore) {
                editor.current.session.insert(cursorPosition, "\n" + ' '.repeat(indentationCurrentLine));
            }
            cursorPosition = editor.current.getCursorPosition();
            editor.current.insertSnippet(text, cursorPosition);
            cursorPosition = editor.current.getCursorPosition();
            if (newLineAfter && -1 === text.indexOf('${')) {
                editor.current.session.insert(cursorPosition, "\n" + ' '.repeat(indentationCurrentLine));
            }
        } else {
            const textToInsert = (newLineBefore ?  "\n" + ' '.repeat(indentationCurrentLine) : "") + text + (newLineAfter ? "\n" + ' '.repeat(indentationCurrentLine) : "");
            editor.current.session.insert(cursorPosition, textToInsert);
        }
        editor.current.focus();
    }

    const resize = () => {
        if (!editor.current) {
            return;
        }

        editor.current.resize(true);
    };

    const doSetSelection = (selection_) => {
        wrapModelToEditor(() => {
            if (sameSelection(selection.current, selection_)) {
                return;
            }
            selection.current = selection_;
            if (selection_ && selection_.start && selection_.end) {
                editor.current.selection.setRange(toRange(selection_));
            } else {
                editor.current.selection.setRange(new Range(0, 0, 0, 0));
            }
        });
    };

    const highlight = (range, className = 'code-highlight') => {
        log.getLogger('editor').debug('make highlight', range, className);
        wrapModelToEditor(() => {
            const session = editor.current.session;
            if (marker.current) {
                session.removeMarker(marker.current);
                marker.current = null;
            }
            if (range && range.start && range.end) {
                // Add (and save) the marker.
                marker.current = session.addMarker(toRange(range), className, 'text');
                if (!props.shield) {
                    /* Also scroll so that the line is visible.  Skipped if the editor has
                       a shield (preventing user input) as this means playback is active,
                       and scrolling is handled by individual events. */
                    editor.current.scrollToLine(range.start.row, /*center*/true, /*animate*/true);
                }
            }
        });
    };

    const getSelectionRange = () => {
        return editor.current && editor.current.getSelectionRange();
    };

    const initEditor = () => {
        if (props.hasAutocompletion && availableBlocks && contextStrings) {
            addAutocompletion(availableBlocks, contextStrings);
        }
        const session = editor.current.getSession();
        session.setUseWorker(false);
        editor.current.$blockScrolling = Infinity;
        // editor.setBehavioursEnabled(false);
        editor.current.setTheme(`ace/theme/${props.theme || 'textmate'}`);
        session.setMode(`ace/mode/${props.mode || 'text'}`);
        editor.current.setFontSize(Math.round(16 * zoomLevel) + 'px');
        editor.current.setOptions({
            readOnly: !!props.readOnly,
            enableBasicAutocompletion: props.hasAutocompletion,
            enableLiveAutocompletion: props.hasAutocompletion,
            enableSnippets: false,
            dragEnabled: props.dragEnabled,
            ...(props.maxLines ? {maxLines: props.maxLines}: {}),
        });
        if (props.hasScrollMargin) {
            editor.current.setOption("scrollPastEnd", 0.1);
            editor.current.renderer.setScrollMargin(0, 80);
        }
        if (props.hideGutter) {
            editor.current.renderer.setShowGutter(false);
        }

        const {onInit, onSelect, onEdit} = props;

        if (typeof onInit === 'function') {
            const api = {
                reset,
                applyDeltas,
                setSelection: doSetSelection,
                focus,
                scrollToLine,
                getSelectionRange,
                highlight,
                resize,
                goToEnd,
                insert,
            };
            onInit(api);
        }

        if (typeof onSelect === 'function') {
            session.selection.on("changeCursor", onSelectionChanged, true);
            session.selection.on("changeSelection", onSelectionChanged, true);
        }
        if (typeof onEdit === 'function') {
            session.on("change", onTextChanged);
        }

        // if (undefined !== props.content) {
        //     reset(documentFromString(String(null !== props.content ? props.content : '')));
        // }

        // @ts-ignore
        editor.current.renderer.on("afterRender", onAfterRender);
        editor.current.commands.addCommand({
            name: "escape",
            bindKey: {
                win: "Esc",
                mac: "Esc",
                sender: "htmleditor"
            },
            exec: function(editor) {
                editor.blur();
            }
        });

        if (props.hasAutocompletion) {
            // @ts-ignore
            let completer = editor.current.completer;
            // we resize the completer window, because some functions are too big so we need more place:
            if (!completer) {
                // make sure completer is initialized
                editor.current.execCommand("startAutocomplete");
                // @ts-ignore
                completer = editor.current.completer;
                completer.detach();
            }
            if (completer && completer.popup) {
                completer.popup.container.style.width = "22%";
            }

            // removal of return for autocomplete
            if (completer.keyboardHandler.commandKeyBinding.return)
                delete completer.keyboardHandler.commandKeyBinding.return;
        }

        /* // Export ACE editors for debugging purposes:
        window.editors = window.editors || {};
        window.editors[buffer] = editor; */

        /* Force a resize, the editor will not work properly otherwise. */
        setTimeout(function() {
            editor.current.resize(true);
        }, 0);
    }

    useEffect(() => {
        const editorObject = window.ace.edit(refEditor.current);
        log.getLogger('editor').debug('create editor', editorObject);
        editor.current = editorObject;
        initEditor();

        return () => {
            if (typeof props.onInit === 'function') {
                props.onInit(null);
            }
        }
    }, []);

    useEffect(() => {
        if (editor.current) {
            editor.current.setReadOnly(props.readOnly);
        }
    }, [props.readOnly]);

    useEffect(() => {
        if (editor.current) {
            editor.current.setFontSize(Math.round(16 * zoomLevel) + 'px');
        }
    }, [zoomLevel]);

    useEffect(() => {
        if (editor.current) {
            editor.current.setAutoScrollEditorIntoView(!props.shield);
        }
    }, [props.shield]);

    useEffect(() => {
        if (editor.current) {
            const session = editor.current.getSession();
            session.setMode(`ace/mode/${props.mode || 'text'}`);
        }
    }, [props.mode]);

    useEffect(() => {
        if (editor.current) {
            editor.current.setTheme(`ace/theme/${props.theme || 'textmate'}`);
        }
    }, [props.theme]);

    useEffect(() => {
        if (editor.current) {
            editor.current.setHighlightActiveLine(false !== props.highlightActiveLine);
        }
    }, [props.highlightActiveLine]);

    useEffect(() => {
        if (editor.current) {
            editor.current.setShowPrintMargin(false !== props.showPrintMargin);
        }
    }, [props.showPrintMargin]);

    useEffect(() => {
        if (editor.current) {
            editor.current.renderer.$cursorLayer.element.style.display = props.hideCursor ? "none" : 'block';
        }
    }, [props.hideCursor]);

    useEffect(() => {
        if (editor.current && availableBlocks) {
            addAutocompletion(availableBlocks, contextStrings);
        }
    }, [availableBlocks, contextStrings]);

    useEffect(() => {
        const deltasToApply = props.state?.actions?.deltasToApply;
        if (!deltasToApply || !deltasToApply.length) {
            return;
        }

        dispatch(bufferClearDeltasToApply({buffer: props.name}));
        applyDeltas(JSON.parse(JSON.stringify(deltasToApply)));
    }, [props.state?.actions?.blocksToInsert]);

    useEffect(() => {
        if ('source' === props.name) {
            // Don't use content for source buffer (for now)
            return;
        }

        const value = props.content ? props.content : '';
        if (value === editor.current.getSession().getValue()) {
            return;
        }

        wrapModelToEditor(() => {
            // if (props.onEditPlain) {
            //     props.onEditPlain(documentFromString(value));
            // }
            editor.current.getSession().setValue(value);
            editor.current.resize(true);
        });
    }, [props.content]);

    useEffect(() => {
        const blocksToInsert = props.state?.actions?.blocksToInsert;
        if (!blocksToInsert || !blocksToInsert.length) {
            return;
        }

        dispatch(bufferClearBlocksToInsert({buffer: props.name}));
        for (let {block, pos} of blocksToInsert) {
            let insertNewLineBefore = false;
            let insertNewLineAfter = false;
            if ((BlockType.Function === block.type && block.category !== 'sensors') || BlockType.Directive === block.type) {
                insertNewLineBefore = insertNewLineAfter = true;
            }
            if (BlockType.Token === block.type && block.snippet && -1 !== block.snippet.indexOf('${')) {
                insertNewLineBefore = true;
            }

            if (block.snippet) {
                insert(block.snippet, pos ? pos : null, true, insertNewLineBefore, insertNewLineAfter);
            } else {
                insert(block.code, pos ? pos : null, false, insertNewLineBefore, insertNewLineAfter);
            }
        }
    }, [props.state?.actions?.blocksToInsert]);

    useEffect(() => {
        const newDocument = props.state?.document;
        const value = documentToString(newDocument);
        if (value === editor.current.getSession().getValue()) {
            return;
        }

        console.log('[editor] document update', {value, oldValue: editor.current.getSession().getValue()});

        wrapModelToEditor(() => {
            editor.current.getSession().setValue(value);
            editor.current.resize(true);
        });
    }, [props.state?.document]);

    useEffect(() => {
        const selection = props.state?.selection;
        console.log('[editor] selection changed', selection);
        doSetSelection(selection);
    }, [props.state?.selection]);

    useEffect(() => {
        highlight(props.state?.highlight);
    }, [props.state?.highlight]);

    useEffect(() => {
        highlight(props.state?.errorHighlight ?? props.errorHighlight, 'error-highlight');
    }, [props.state?.errorHighlight ?? props.errorHighlight]);

    useEffect(() => {
        if (0 < props.state?.actions?.goToEnd) {
            goToEnd();
            return;
        }
    }, [props.state?.actions?.goToEnd]);

    useEffect(() => {
        if (0 < props.state?.actions?.resize) {
            resize();
            return;
        }
    }, [props.state?.actions?.resize]);

    useEffect(() => {
        scrollToLine(props.state?.firstVisibleRow);
    }, [props.state?.firstVisibleRow]);

    const {width, height, shield} = props;

    const [, drop] = useDrop(() => ({
        accept: ['block'],
        drop(item: DraggableBlockItem, monitor) {
            const offset = monitor.getClientOffset();
            // noinspection JSVoidFunctionReturnValueUsed
            const pos = editor.current.renderer.screenToTextCoordinates(offset.x, offset.y);
            if (props.onDropBlock) {
                props.onDropBlock(item.block, pos);
            }
        },
        hover(item, monitor) {
            const offset = monitor.getClientOffset();
            // noinspection JSVoidFunctionReturnValueUsed
            const pos = editor.current.renderer.screenToTextCoordinates(offset.x, offset.y);
            editor.current.moveCursorTo(pos.row, pos.column);
            editor.current.selection.clearSelection();
        },
    }));

    return (
        <div className="editor" style={{width: width, height: height}} ref={drop}>
            <div className="editor-frame" ref={refEditor}/>
            <div
                className={classnames(['editor-shield', shield && 'editor-shield-up'])}
                title={getMessage('PROGRAM_CANNOT_BE_MODIFIED_WHILE_RUNNING')}
            />
        </div>
    );
}

