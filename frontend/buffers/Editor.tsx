import React, {useEffect, useRef, useState} from 'react';
import classnames from 'classnames';
import * as ace from 'brace';
import {addAutocompletion} from "./editorAutocompletion";
import {quickAlgoLibraries} from "../task/libs/quickalgo_librairies";
import {Document, ObjectDocument} from "./document";
import {getMessage} from "../lang";
import {DraggableBlockItem, getContextBlocksDataSelector} from "../task/blocks/blocks";
import {useAppSelector} from "../hooks";
import {useDrop} from "react-dnd";
import {DocumentModel} from "./index";

const Range = ace.acequire('ace/range').Range;

interface EditorProps {
    readOnly: boolean,
    shield: boolean,
    theme: string,
    mode: string,
    width: any,
    height: any,
    hasAutocompletion?: boolean,
    onSelect: Function,
    onEdit: Function,
    onScroll: Function,
    onInit: Function,
    onDropBlock: Function,
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
    const [selection, setSelection] = useState<any>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [firstVisibleRow, setFirstVisibleRow] = useState(0);
    const [willUpdateSelection, setWillUpdateSelection] = useState(false);

    const editor = useRef(null);
    const mute = useRef(false);
    const marker = useRef();

    const context = quickAlgoLibraries.getContext(null, 'main');
    const availableBlocks = useAppSelector(state => context && 'text' !== props.mode ? getContextBlocksDataSelector(state, context) : []);
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const contextStrings = useAppSelector(state => state.task.contextStrings);

    const refEditor = useRef();

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
            if (sameSelection(selection, selection_))
                return;
            setSelection(selection_);
            props.onSelect(selection_);
        });
    };

    const onTextChanged = (edit) => {
        if (mute.current) {
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

    const reset = (value: Document, selection, firstVisibleRow) => {
        wrapModelToEditor(() => {
            editor.current.getSession().setValue(value.toString());
            editor.current.resize(true);
            setSelection(null);
            doSetSelection(selection);
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

    const insert = (text, pos = null, withoutNewLine = false, snippet = false) => {
        if (!editor.current) {
            return;
        }

        const cursorPosition = pos ? pos : editor.current.getCursorPosition();
        const textAfter = editor.current.session.doc.getTextRange(new Range(cursorPosition.row, cursorPosition.column, Infinity, Infinity));
        const indentationCurrentLine = editor.current.session.doc.getLine(cursorPosition.row).search(/\S|$/);
        if (snippet) {
            editor.current.insertSnippet(text, cursorPosition);
            if (text.indexOf("${") === -1) {
                editor.current.session.insert({row: cursorPosition.row + 1, column: cursorPosition.column}, (!textAfter.trim().length && !withoutNewLine ? "\n" + ' '.repeat(indentationCurrentLine) : ""));
            }
        } else {
            editor.current.session.insert(cursorPosition, text + (!textAfter.trim().length && !withoutNewLine ? "\n" + ' '.repeat(indentationCurrentLine) : ""));
        }
        editor.current.focus();
    }

    const insertSnippet = (snippet, pos) => {
        insert(snippet, pos, false, true);
    }

    const resize = () => {
        if (!editor.current) {
            return;
        }

        editor.current.resize(true);
    };

    const doSetSelection = (selection_) => {
        wrapModelToEditor(() => {
            if (sameSelection(selection, selection_)) {
                return;
            }
            setSelection(selection_);
            if (selection_ && selection_.start && selection_.end) {
                editor.current.selection.setRange(toRange(selection_));
            } else {
                editor.current.selection.setRange(new Range(0, 0, 0, 0));
            }
        });
    };

    const highlight = (range) => {
        console.log('make highlight');
        wrapModelToEditor(() => {
            const session = editor.current.session;
            console.log('remove marker', marker.current);
            if (marker.current) {
                session.removeMarker(marker.current);
                marker.current = null;
            }
            if (range && range.start && range.end) {
                // Add (and save) the marker.
                console.log('add maker');
                marker.current = session.addMarker(toRange(range), 'code-highlight', 'text');
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
        editor.current.$blockScrolling = Infinity;
        // editor.setBehavioursEnabled(false);
        editor.current.setTheme(`ace/theme/${props.theme || 'github'}`);
        session.setMode(`ace/mode/${props.mode || 'text'}`);
        editor.current.setFontSize(Math.round(16 * zoomLevel) + 'px');
        // editor.setOptions({minLines: 25, maxLines: 50});
        editor.current.setOptions({
            readOnly: !!props.readOnly,
            enableBasicAutocompletion: props.hasAutocompletion,
            enableLiveAutocompletion: props.hasAutocompletion,
            enableSnippets: false,
            dragEnabled: true,
        });

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
                insertSnippet,
                getEmptyModel() {
                    return new DocumentModel();
                },
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
        const editorObject = ace.edit(refEditor.current);
        console.log('create editor', editorObject);
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
            editor.current.setTheme(`ace/theme/${props.theme || 'github'}`);
        }
    }, [props.theme]);

    useEffect(() => {
        if (editor.current) {
            addAutocompletion(availableBlocks, contextStrings);
        }
    }, [availableBlocks, contextStrings]);

    const {width, height, shield} = props;

    const [, drop] = useDrop(() => ({
        accept: ['block'],
        drop(item: DraggableBlockItem, monitor) {
            const offset = monitor.getClientOffset();
            // noinspection JSVoidFunctionReturnValueUsed
            const pos = editor.current.renderer.screenToTextCoordinates(offset.x, offset.y);
            props.onDropBlock(item.block, pos);
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
