
import React from 'react';
import EpicComponent from 'epic-component';
import * as ace from 'brace';
const Range = ace.acequire('ace/range').Range;

export const Editor = EpicComponent(self => {

  let editor;
  let editorNode;
  let selection = null;
  let marker = null;
  let mute = false;
  let scrollTop = 0;
  let firstVisibleRow = 0;

  function toRange (selection) {
    return new Range(
      selection.start.row, selection.start.column,
      selection.end.row, selection.end.column);
  }

  const refEditor = function (node) {
    editorNode = node;
  };

  const samePosition = function (p1, p2) {
    return p1 && p2 && p1.row == p2.row && p1.column == p2.column;
  };

  const sameSelection = function (s1, s2) {
    if (typeof s1 !== typeof s2 || !!s1 !== !!s2) {
      return false;
    }
    // Test for same object (and also null).
    if (s1 === s2) {
      return true;
    }
    return samePosition(s1.start, s2.start) && samePosition(s1.end, s2.end);
  };

  /*
    Performance fix: Ace fires many redundant selection events, so we wait
    until the next animation frame before querying the selection and firing
    the onSelect callback.
  */
  let willUpdateSelection = false;
  const onSelectionChanged = function () {
    if (mute || willUpdateSelection) {
      return;
    }
    // const isUserChange = editor.curOp && editor.curOp.command.name;
    willUpdateSelection = true;
    window.requestAnimationFrame(function () {
      willUpdateSelection = false;
      const selection_ = editor.selection.getRange();
      if (sameSelection(selection, selection_))
        return;
      selection = selection_;
      self.props.onSelect(selection);
    });
  };

  const onTextChanged = function (edit) {
    if (mute) {
      return;
    }
    // The callback must not trigger a rendering of the Editor.
    self.props.onEdit(edit)
  };

  const onAfterRender = function () {
    if (mute) {
      return;
    }
    const scrollTop_ = editor.getSession().getScrollTop();
    const firstVisibleRow_ = editor.getFirstVisibleRow();
    if (scrollTop !== scrollTop_) {
      scrollTop = scrollTop_;
      const {onScroll} = self.props;
      if (typeof onScroll === 'function') {
        const firstVisibleRow_ = editor.getFirstVisibleRow();
        if (firstVisibleRow !== firstVisibleRow_) {
          firstVisibleRow = firstVisibleRow_;
          onScroll(firstVisibleRow_);
        }
      }
    }
  };

  const wrapModelToEditor = function (cb) {
    if (!editor) {
      return;
    }
    mute = true;
    try {
      cb();
    } finally {
      mute = false;
    }
  };

  const reset = function (value, selection_, firstVisibleRow_) {
    wrapModelToEditor(function () {
      editor.setValue(value);
      // Work-around for strange ACE behavior?
      selection = null;
      setSelection(selection_);
      editor.scrollToLine(firstVisibleRow_);
      firstVisibleRow = firstVisibleRow_;
      // Clear a previously set marker, if any.
      if (marker) {
        editor.session.removeMarker(marker);
        marker = null;
      }
    });
  };

  const applyDeltas = function (deltas) {
    wrapModelToEditor(function () {
      editor.session.doc.applyDeltas(deltas);
    });
  };

  const focus = function () {
    if (!editor)
      return;
    editor.focus();
  };

  const scrollToLine = function (firstVisibleRow_) {
    wrapModelToEditor(function () {
      editor.scrollToLine(firstVisibleRow_);
      firstVisibleRow_ = firstVisibleRow;
    });
  };

  const setSelection = function (selection_) {
    wrapModelToEditor(function () {
      if (sameSelection(selection, selection_)) {
        return;
      }
      selection = selection_;
      if (selection && selection.start && selection.end) {
        editor.selection.setRange(toRange(selection));
      } else {
        editor.selection.setRange(new Range(0, 0, 0, 0));
      }
    });
  };

  const highlight = function (range) {
    wrapModelToEditor(function () {
      const session = editor.session;
      if (marker) {
        session.removeMarker(marker);
        marker = null;
      }
      if (range && range.start && range.end) {
        marker = session.addMarker(toRange(range), "code-highlight", "text");
      }
    });
  };

  const getSelectionRange = function () {
    return editor && editor.getSelectionRange();
  };

  self.componentDidMount = function () {
    editor = ace.edit(editorNode);
    const session = editor.getSession();
    editor.$blockScrolling = Infinity;
    // editor.setBehavioursEnabled(false);
    editor.setTheme(`ace/theme/${self.props.theme||'github'}`);
    session.setMode(`ace/mode/${self.props.mode||'text'}`);
    // editor.setOptions({minLines: 25, maxLines: 50});
    editor.setReadOnly(self.props.readOnly);
    const {onInit, onSelect, onEdit, onScroll} = self.props;
    if (typeof onInit === 'function') {
      const api = {reset, applyDeltas, setSelection, focus, scrollToLine, getSelectionRange, highlight};
      onInit(api);
    }
    if (typeof onSelect === 'function') {
      session.selection.on("changeCursor", onSelectionChanged, true);
      session.selection.on("changeSelection", onSelectionChanged, true);
    }
    if (typeof onEdit === 'function') {
      session.on("change", onTextChanged);
    }
    editor.renderer.on("afterRender", onAfterRender);
  };

  self.componentWillReceiveProps = function (nextProps) {
    if (editor) {
      if (self.props.readOnly !== nextProps.readOnly) {
        editor.setReadOnly(nextProps.readOnly);
      }
    }
  };

  self.componentWillUnmount = function () {
    if (typeof self.props.onInit === 'function') {
      self.props.onInit(null);
    }
  };

  self.render = function () {
    const {width, height} = self.props;
    return <div ref={refEditor} style={{width: width, height: height}}></div>
  };

});

export default Editor;