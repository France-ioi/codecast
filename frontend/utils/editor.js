
import React from 'react';
import EpicComponent from 'epic-component';
import * as ace from 'brace';
const Range = ace.acequire('ace/range').Range;

export const Editor = EpicComponent(self => {

  let editor, editorNode, selection = null;

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

  const setSelection = function (selection_) {
    if (!editor || sameSelection(selection, selection_))
      return;
    selection = selection_;
    if (selection && selection.start && selection.end) {
      editor.selection.setRange(new Range(
        selection.start.row, selection.start.column,
        selection.end.row, selection.end.column));
    } else {
      editor.selection.setRange(new Range(0, 0, 0, 0));
    }
  };

  /*
    Performance fix: Ace fires many redundant selection events, so we wait
    until the next animation frame before querying the selection and firing
    the onSelect callback.
  */
  let willUpdateSelection = false;
  const onSelectionChanged = function () {
    if (willUpdateSelection)
      return;
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
    // The callback must not trigger a rendering of the Editor.
    self.props.onEdit(edit)
  };

  const reset = function (value, selection) {
    if (!editor)
      return;
    editor.setValue(value);
    setSelection(selection);
  };

  const applyDeltas = function (deltas) {
    if (!editor)
      return;
    editor.session.doc.applyDeltas(deltas);
  };

  const focus = function () {
    if (!editor)
      return;
    editor.focus();
  };

  const setScrollTop = function (top) {
    if (editor) {
      editor.session.setScrollTop(top);
    }
  };

  let lastScrollTop = 0;

  self.componentDidMount = function () {
    editor = ace.edit(editorNode);
    editor.$blockScrolling = Infinity;
    // WORKAROUND: disable autocomplete
    editor.setBehavioursEnabled(false);
    editor.setTheme(`ace/theme/${self.props.theme||'github'}`);
    editor.getSession().setMode(`ace/mode/${self.props.mode||'text'}`);
    // editor.setOptions({minLines: 25, maxLines: 50});
    editor.setReadOnly(self.props.readOnly);
    const {onInit, onSelect, onEdit, onScroll} = self.props;
    if (typeof onInit === 'function') {
      const api = {reset, applyDeltas, setSelection, focus, setScrollTop};
      onInit(api);
    }
    if (typeof onSelect === 'function') {
      editor.selection.addEventListener("changeCursor", onSelectionChanged, true);
      editor.selection.addEventListener("changeSelection", onSelectionChanged, true);
    }
    if (typeof onEdit === 'function') {
      editor.session.doc.on("change", onTextChanged, true);
    }
    editor.renderer.on("afterRender", function (e) {
      const scrollTop = editor.session.getScrollTop();
      if (lastScrollTop !== scrollTop) {
        lastScrollTop = scrollTop;
        if (typeof onScroll === 'function') {
          const firstVisibleRow = editor.getFirstVisibleRow();
          onScroll(scrollTop, firstVisibleRow);
        }
      }
    });
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