import React, {useEffect, useRef, useState} from 'react';
import classnames from 'classnames';
import * as ace from 'brace';
import {addAutocompletion} from "./editorAutocompletion";
import {quickAlgoLibraries} from "../task/libs/quickalgo_librairies";
import {getMessage} from "../lang";
import {DraggableBlockItem, getContextBlocksDataSelector} from "../task/blocks/blocks";
import {useAppSelector} from "../hooks";
import {useDrop} from "react-dnd";

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
    const [editor, setEditor] = useState<any>(null);
    const [selection, setSelection] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);
    const [mute, setMute] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [firstVisibleRow, setFirstVisibleRow] = useState(0);
    const [willUpdateSelection, setWillUpdateSelection] = useState(false);

    const editorRef = useRef(editor);
    editorRef.current = editor;

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
        if (mute || willUpdateSelection) {
            return;
        }
        // const isUserChange = editor.curOp && editor.curOp.command.name;
        setWillUpdateSelection(true);
        window.requestAnimationFrame(() => {
            setWillUpdateSelection(false);
            const selection_ = editor.selection.getRange();
            if (sameSelection(selection, selection_))
                return;
            setSelection(selection_);
            props.onSelect(selection_);
        });
    };

    const onTextChanged = (edit) => {
        if (mute) {
            return;
        }
        // The callback must not trigger a rendering of the Editor.
        props.onEdit(edit)
    };

    const onAfterRender = () => {
        if (mute) {
            return;
        }
        const scrollTop_ = editor.getSession().getScrollTop();
        if (scrollTop !== scrollTop_) {
            setScrollTop(scrollTop_);
            const {onScroll} = props;
            if (typeof onScroll === 'function') {
                const firstVisibleRow_ = editor.getFirstVisibleRow();
                if (firstVisibleRow !== firstVisibleRow_) {
                    setFirstVisibleRow(firstVisibleRow_);
                    onScroll(firstVisibleRow_);
                }
            }
        }
    };

    const wrapModelToEditor = (cb) => {
        if (!editor) {
            return;
        }
        setMute(true);
        try {
            cb();
        } finally {
            setMute(false);
        }
    };

    const reset = (value, selection, firstVisibleRow) => {
        wrapModelToEditor(() => {
            editor.getSession().setValue(value);
            editor.resize(true);
            setSelection(null);
            doSetSelection(selection);
            setFirstVisibleRow(firstVisibleRow);
            editor.scrollToLine(firstVisibleRow);
            setScrollTop(editor.getSession().getScrollTop());
            // Clear a previously set marker, if any.
            if (marker) {
                editor.session.removeMarker(marker);
                setMarker(null);
            }
        });
    };

    const applyDeltas = (deltas) => {
        wrapModelToEditor(() => {
            editor.session.doc.applyDeltas(deltas);
        });
    };

    const focus = () => {
        if (!editor) {
            return;
        }

        editor.focus();
    };

    const scrollToLine = (firstVisibleRow) => {
        wrapModelToEditor(() => {
            editor.resize(true);
            setFirstVisibleRow(firstVisibleRow);
            editor.scrollToLine(firstVisibleRow);
            setScrollTop(editor.getSession().getScrollTop());
        });
    };

    const goToEnd = () => {
        if (!editor) {
            return;
        }

        editor.gotoLine(Infinity, Infinity, false);
    }

    const resize = () => {
        if (!editor) {
            return;
        }

        editor.resize(true);
    };

    const doSetSelection = (selection_) => {
        wrapModelToEditor(() => {
            if (sameSelection(selection, selection_)) {
                return;
            }
            setSelection(selection_);
            if (selection_ && selection_.start && selection_.end) {
                editor.selection.setRange(toRange(selection_));
            } else {
                editor.selection.setRange(new Range(0, 0, 0, 0));
            }
        });
    };

    const highlight = (range) => {
        wrapModelToEditor(() => {
            const session = editor.session;
            if (marker) {
                session.removeMarker(marker);
                setMarker(null);
            }
            if (range && range.start && range.end) {
                // Add (and save) the marker.
                setMarker(session.addMarker(toRange(range), 'code-highlight', 'text'));
                if (!props.shield) {
                    /* Also scroll so that the line is visible.  Skipped if the editor has
                       a shield (preventing user input) as this means playback is active,
                       and scrolling is handled by individual events. */
                    editor.scrollToLine(range.start.row, /*center*/true, /*animate*/true);
                }
            }
        });
    };

    const getSelectionRange = () => {
        return editor && editor.getSelectionRange();
    };

    const initEditor = () => {
        console.log('init editor', editor);
        if (props.hasAutocompletion && availableBlocks && contextStrings) {
            addAutocompletion(availableBlocks, contextStrings);
        }
        const session = editor.getSession();
        editor.$blockScrolling = Infinity;
        // editor.setBehavioursEnabled(false);
        editor.setTheme(`ace/theme/${props.theme || 'github'}`);
        session.setMode(`ace/mode/${props.mode || 'text'}`);
        editor.setFontSize(Math.round(16 * zoomLevel) + 'px');
        // editor.setOptions({minLines: 25, maxLines: 50});
        editor.setOptions({
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
        editor.renderer.on("afterRender", onAfterRender);
        editor.commands.addCommand({
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
            let completer = editor.completer;
            // we resize the completer window, because some functions are too big so we need more place:
            if (!completer) {
                // make sure completer is initialized
                editor.execCommand("startAutocomplete");
                // @ts-ignore
                completer = editor.completer;
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
            editor.resize(true);
        }, 0);
    }

    useEffect(() => {
        const editor = ace.edit(refEditor.current);
        console.log('create editor', editor);
        setEditor(editor);

        return () => {
            if (typeof props.onInit === 'function') {
                props.onInit(null);
            }
        }
    }, []);

    useEffect(() => {
        if (editor) {
            initEditor();
        }
    }, [editor]);

    useEffect(() => {
        if (editor) {
            editor.setReadOnly(props.readOnly);
        }
    }, [props.readOnly]);

    useEffect(() => {
        if (editor) {
            editor.setFontSize(Math.round(16 * zoomLevel) + 'px');
        }
    }, [zoomLevel]);

    useEffect(() => {
        if (editor) {
            editor.setAutoScrollEditorIntoView(!props.shield);
        }
    }, [props.shield]);

    useEffect(() => {
        if (editor) {
            const session = editor.getSession();
            session.setMode(`ace/mode/${props.mode || 'text'}`);
        }
    }, [props.mode]);

    useEffect(() => {
        if (editor) {
            editor.setTheme(`ace/theme/${props.theme || 'github'}`);
        }
    }, [props.theme]);

    useEffect(() => {
        if (editor) {
            addAutocompletion(availableBlocks, contextStrings);
        }
    }, [availableBlocks, contextStrings]);

    const {width, height, shield} = props;

    const [collectedProps, drop] = useDrop(() => ({
        accept: ['block'],
        drop(item: DraggableBlockItem, monitor) {
            console.log('editor elm', editor, editorRef.current);
            const offset = monitor.getClientOffset();
            // noinspection JSVoidFunctionReturnValueUsed
            const pos = editorRef.current.renderer.screenToTextCoordinates(offset.x, offset.y);
            editorRef.current.session.insert(pos, item.block.caption);
        },
        hover(item, monitor) {
            console.log('is hovering');
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
