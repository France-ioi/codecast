import React from 'react';
import classnames from 'classnames';
import * as ace from 'brace';
import {connect} from "react-redux";
import {AppStore} from "../store";
import {addAutocompletion} from "./editorAutocompletion";
import {AutocompletionParameters, getAutocompletionParameters} from '../task';
import {LayoutType} from "../task/layout/layout";
import {quickAlgoLibraries, QuickAlgoLibrary} from "../task/libs/quickalgo_librairies";

const Range = ace.acequire('ace/range').Range;

interface EditorStateToProps {
    getMessage: Function,
    context: QuickAlgoLibrary,
    layoutType: LayoutType,
    autocompletionParameters: AutocompletionParameters,
}

function mapStateToProps(state: AppStore): EditorStateToProps {
    const context = quickAlgoLibraries.getContext();
    const autocompletionParameters = context ? getAutocompletionParameters(context, state.task.currentLevel) : null;

    return {
        getMessage: state.getMessage,
        context,
        layoutType: state.layout.type,
        autocompletionParameters,
    };
}

interface EditorProps extends EditorStateToProps {
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
    onInit: Function
}

class _Editor extends React.PureComponent<EditorProps> {
    editor: any = null;
    editorNode: any = null;
    selection: any = null;
    marker: any = null;
    mute: boolean = false;
    scrollTop: number = 0;
    firstVisibleRow: number = 0;
    willUpdateSelection: boolean = false;

    refEditor = (node) => {
        this.editorNode = node;
    };

    /*
      Performance fix: Ace fires many redundant selection events, so we wait
      until the next animation frame before querying the selection and firing
      the onSelect callback.
    */
    onSelectionChanged = () => {
        if (this.mute || this.willUpdateSelection) {
            return;
        }
        // const isUserChange = editor.curOp && editor.curOp.command.name;
        this.willUpdateSelection = true;
        window.requestAnimationFrame(() => {
            this.willUpdateSelection = false;
            const selection_ = this.editor.selection.getRange();
            if (sameSelection(this.selection, selection_))
                return;
            this.selection = selection_;
            this.props.onSelect(selection_);
        });
    };

    onTextChanged = (edit) => {
        if (this.mute) {
            return;
        }
        // The callback must not trigger a rendering of the Editor.
        this.props.onEdit(edit)
    };

    onAfterRender = () => {
        if (this.mute) {
            return;
        }
        const scrollTop_ = this.editor.getSession().getScrollTop();
        if (this.scrollTop !== scrollTop_) {
            this.scrollTop = scrollTop_;
            const {onScroll} = this.props;
            if (typeof onScroll === 'function') {
                const firstVisibleRow_ = this.editor.getFirstVisibleRow();
                if (this.firstVisibleRow !== firstVisibleRow_) {
                    this.firstVisibleRow = firstVisibleRow_;
                    onScroll(firstVisibleRow_);
                }
            }
        }
    };

    wrapModelToEditor = (cb) => {
        if (!this.editor) {
            return;
        }
        this.mute = true;
        try {
            cb();
        } finally {
            this.mute = false;
        }
    };

    reset = (value, selection, firstVisibleRow) => {
        this.wrapModelToEditor(() => {
            this.editor.getSession().setValue(value);
            this.editor.resize(true);
            this.setSelection(selection);
            this.firstVisibleRow = firstVisibleRow;
            this.editor.scrollToLine(firstVisibleRow);
            this.scrollTop = this.editor.getSession().getScrollTop();
            // Clear a previously set marker, if any.
            if (this.marker) {
                this.editor.session.removeMarker(this.marker);
                this.marker = null;
            }
        });
    };

    applyDeltas = (deltas) => {
        this.wrapModelToEditor(() => {
            this.editor.session.doc.applyDeltas(deltas);
        });
    };

    focus = () => {
        if (!this.editor) {
            return;
        }

        this.editor.focus();
    };

    scrollToLine = (firstVisibleRow) => {
        this.wrapModelToEditor(() => {
            this.editor.resize(true);
            this.firstVisibleRow = firstVisibleRow;
            this.editor.scrollToLine(firstVisibleRow);
            this.scrollTop = this.editor.getSession().getScrollTop();
        });
    };

    resize = () => {
        if (!this.editor) {
            return;
        }

        this.editor.resize(true);
    };

    setSelection = (selection_) => {
        this.wrapModelToEditor(() => {
            if (sameSelection(this.selection, selection_)) {
                return;
            }
            this.selection = selection_;
            if (this.selection && this.selection.start && this.selection.end) {
                this.editor.selection.setRange(toRange(this.selection));
            } else {
                this.editor.selection.setRange(new Range(0, 0, 0, 0));
            }
        });
    };

    highlight = (range) => {
        this.wrapModelToEditor(() => {
            const session = this.editor.session;
            if (this.marker) {
                session.removeMarker(this.marker);
                this.marker = null;
            }
            if (range && range.start && range.end) {
                // Add (and save) the marker.
                this.marker = session.addMarker(toRange(range), 'code-highlight', 'text');
                if (!this.props.shield) {
                    /* Also scroll so that the line is visible.  Skipped if the editor has
                       a shield (preventing user input) as this means playback is active,
                       and scrolling is handled by individual events. */
                    this.editor.scrollToLine(range.start.row, /*center*/true, /*animate*/true);
                }
            }
        });
    };

    getSelectionRange = () => {
        return this.editor && this.editor.getSelectionRange();
    };

    componentDidMount() {
        const editor = this.editor = ace.edit(this.editorNode);
        if (this.props.hasAutocompletion && this.props.autocompletionParameters) {
            const {includeBlocks, strings, constants} = this.props.autocompletionParameters;
            addAutocompletion(this.props.mode, this.props.getMessage, includeBlocks, constants, strings);
        }
        const session = this.editor.getSession();
        editor.$blockScrolling = Infinity;
        // editor.setBehavioursEnabled(false);
        editor.setTheme(`ace/theme/${this.props.theme || 'github'}`);
        session.setMode(`ace/mode/${this.props.mode || 'text'}`);
        if (LayoutType.MobileHorizontal === this.props.layoutType || LayoutType.MobileVertical === this.props.layoutType) {
            editor.setFontSize('16px');
        }
        // editor.setOptions({minLines: 25, maxLines: 50});
        editor.setOptions({
            readOnly: !!this.props.readOnly,
            enableBasicAutocompletion: this.props.hasAutocompletion,
            enableLiveAutocompletion: this.props.hasAutocompletion,
            enableSnippets: false,
        });

        const {onInit, onSelect, onEdit} = this.props;
        if (typeof onInit === 'function') {
            const api = {
                reset: this.reset,
                applyDeltas: this.applyDeltas,
                setSelection: this.setSelection,
                focus: this.focus,
                scrollToLine: this.scrollToLine,
                getSelectionRange: this.getSelectionRange,
                highlight: this.highlight,
                resize: this.resize,
            };
            onInit(api);
        }
        if (typeof onSelect === 'function') {
            session.selection.on("changeCursor", this.onSelectionChanged, true);
            session.selection.on("changeSelection", this.onSelectionChanged, true);
        }
        if (typeof onEdit === 'function') {
            session.on("change", this.onTextChanged);
        }

        // @ts-ignore
        editor.renderer.on("afterRender", this.onAfterRender);
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

        if (this.props.hasAutocompletion) {
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
    };

    componentDidUpdate(prevProps) {
        if (this.editor) {
            if (prevProps.readOnly !== this.props.readOnly) {
                this.editor.setReadOnly(this.props.readOnly);
            }

            /* Do not auto-scroll when shielded. */
            this.editor.setAutoScrollEditorIntoView(!this.props.shield);

            const session = this.editor.getSession();
            if (prevProps.mode !== this.props.mode) {
                session.setMode(`ace/mode/${this.props.mode || 'text'}`);
            }
            if (prevProps.theme !== this.props.theme) {
                this.editor.setTheme(`ace/theme/${this.props.theme || 'github'}`);
            }

            if (this.props.hasAutocompletion && this.props.autocompletionParameters && prevProps.mode !== this.props.mode) {
                const {includeBlocks, strings, constants} = this.props.autocompletionParameters;
                addAutocompletion(this.props.mode, this.props.getMessage, includeBlocks, constants, strings);
            }
        }
    };

    componentWillUnmount() {
        if (typeof this.props.onInit === 'function') {
            this.props.onInit(null);
        }
    };

    render() {
        const {width, height, shield, getMessage} = this.props;

        return (
            <div className="editor" style={{width: width, height: height}}>
                <div className="editor-frame" ref={this.refEditor}/>
                <div
                    className={classnames(['editor-shield', shield && 'editor-shield-up'])}
                    title={getMessage('PROGRAM_CANNOT_BE_MODIFIED_WHILE_RUNNING')}
                />
            </div>
        );
    }
}

export const Editor = connect(mapStateToProps)(_Editor);

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
