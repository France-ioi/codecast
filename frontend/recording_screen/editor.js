
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
    return p1.row == p2.row && p1.column == p2.column;
  };

  const sameSelection = function (s1, s2) {
    if (typeof s1 !== typeof s2 || !!s1 !== !!s2)
      return false;
    return samePosition(s1.start, s2.start) && samePosition(s1.end, s2.end);
  };

  const setSelection = function (selection_) {
    if (!editor || sameSelection(selection, selection_))
      return;
    selection = selection_;
    if (selection) {
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

  self.componentDidMount = function () {
    editor = ace.edit(editorNode);
    editor.$blockScrolling = Infinity;
    editor.setTheme('ace/theme/github');
    editor.getSession().setMode('ace/mode/c_cpp');
    // editor.setShowPrintMargin(false);
    // editor.setOptions({minLines: 25, maxLines: 50});
    // readOnly={readOnly}
    editor.setReadOnly(self.props.readOnly);
    editor.setValue(self.props.value);
    setSelection(self.props.selection);
    editor.focus();
    editor.selection.addEventListener("changeCursor", onSelectionChanged, true);
    editor.selection.addEventListener("changeSelection", onSelectionChanged, true);
    editor.session.doc.on("change", onTextChanged, true);
  };

  self.render = function () {
    const {name, value, selection, onChange, readOnly} = self.props;
    setSelection(selection);
    // value={value} onChange={onChange}
    return <div ref={refEditor} style={{width: '100%', height: '336px'}}></div>
  };

});

export default Editor;