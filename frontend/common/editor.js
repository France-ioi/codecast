
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

  self.componentWillReceiveProps = function (nextProps) {
    if (editor) {
      if (self.props.selection !== nextProps.selection) {
        setSelection(nextProps.selection);
      }
    }
  };

  self.componentDidMount = function () {
    editor = ace.edit(editorNode);
    editor.$blockScrolling = Infinity;
    editor.setTheme('ace/theme/github');
    editor.getSession().setMode('ace/mode/c_cpp');
    // editor.setOptions({minLines: 25, maxLines: 50});
    editor.setReadOnly(self.props.readOnly);
    if ('onInit' in self.props) {
      const init = self.props.onInit();
      editor.setValue(init.value.toString());
      setSelection(init.selection);
      if (init.focus) {
        editor.focus();
      }
    } else {
      // XXX deprecate, always use onInit for now (later, value should be a
      // persistent document).
      editor.setValue(self.props.value);
      setSelection(self.props.selection);
      editor.focus();
    }
    const {onSelect, onEdit} = self.props;
    if (typeof onSelect === 'function') {
      editor.selection.addEventListener("changeCursor", onSelectionChanged, true);
      editor.selection.addEventListener("changeSelection", onSelectionChanged, true);
    }
    if (typeof onEdit === 'function') {
      editor.session.doc.on("change", onTextChanged, true);
    }
  };

  self.render = function () {
    setSelection(self.props.selection);
    return <div ref={refEditor} style={{width: '100%', height: '336px'}}></div>
  };

});

export default Editor;