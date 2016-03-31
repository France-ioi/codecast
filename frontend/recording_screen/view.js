
import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import AceEditor from 'react-ace';
import EpicComponent from 'epic-component';
import * as ace from 'brace';
const Range = ace.acequire('ace/range').Range;

import Terminal from '../terminal';
import actions from '../actions';
import {recordEventAction} from '../recorder';

export const Editor = EpicComponent(self => {

  let editor, selection = null;

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

  const onSelectionChanged = function () {
    const selection_ = editor.selection.getRange();
    if (sameSelection(selection, selection_))
      return;
    selection = selection_;
    self.props.onSelect(selection);
  };

  const onTextChanged = function (edit) {
    // The callback must not trigger a rendering of the Editor.
    self.props.onEdit(edit)
  };

  const onLoad = function (editor_) {
    editor = editor_;
    editor.$blockScrolling = Infinity;
    setSelection(self.props.selection);
    editor.selection.addEventListener("changeCursor", onSelectionChanged, true);
    editor.selection.addEventListener("changeSelection", onSelectionChanged, true);
    editor.session.doc.on("change", onTextChanged, true);
    editor.focus();
  };

  self.render = function () {
    const {name, value, selection, onChange, readOnly} = self.props;
    setSelection(selection);
    return <AceEditor mode="c_cpp" theme="github" name={name} value={value} onLoad={onLoad} onChange={onChange} readOnly={readOnly} width='100%' height='336px'/>;
  };

});

export const RecordingScreen = EpicComponent(self => {

  const onSourceSelect = function (selection) {
    console.log('onSourceSelect');
    self.props.dispatch({type: actions.recordingScreenSourceSelectionChanged, selection});
    self.props.dispatch(recordEventAction(['select', selection]));
  };

  const onSourceEdit = function (edit) {
    console.log('onSourceEdit');
    const {start, end} = edit;
    const range = {start, end};
    if (edit.action === 'insert') {
      self.props.dispatch(recordEventAction(['insert', range, edit.lines]));
    } else {
      self.props.dispatch(recordEventAction(['delete', range]));
    }
  };

  const onSourceChange = function (source) {
    console.log('onSourceChange');
    self.props.dispatch({type: actions.recordingScreenSourceTextChanged, source});
  };

  const onTranslate = function () {
    const {source} = self.props;
    self.props.dispatch({
      type: actions.translateSource,
      language: 'c',
      source: source
    });
  };

  const onStepExpr = function () {
    self.props.dispatch({type: actions.recordingScreenStepperStep, mode: 'expr'});
  };

  const onStepInto = function () {
    self.props.dispatch({type: actions.recordingScreenStepperStep, mode: 'into'});
  };

  const onStepOut = function () {
    self.props.dispatch({type: actions.recordingScreenStepperStep, mode: 'out'});
  };

  const onRestart = function () {
    self.props.dispatch({type: actions.recordingScreenStepperRestart});
  };

  const onEdit = function () {
    self.props.dispatch({type: actions.recordingScreenStepperExit});
  };

  const onPauseRecording = function () {
    // TODO
  };

  const onStopRecording = function () {
    // TODO
  };

  const renderStack = function (state, scope) {
    const elems = [];
    while (scope) {
      switch (scope.kind) {
        case 'function':
          elems.push(
            <div key={scope.key}>
              <span>{"function "}{scope.block[1].name}</span>
            </div>
          );
          break;
        case 'block':
          elems.push(
            <div key={scope.key}>
              <span>{"block"}</span>
            </div>
          );
          break;
        case 'vardecl':
          elems.push(
            <div key={scope.key}>
              <span>{"var "}</span>
              <span>{scope.decl.name}</span>
              {' = '}
              <span>JSON.stringify({deref(state, scope.decl.ref, scope.decl.ty)})</span>
            </div>
          );
          break;
        case 'param':
          elems.push(
            <div key={scope.key}>
              <span>{"var "}</span>
              <span>{scope.decl.name}</span>
              {' = '}
              <span>{JSON.stringify(deref(state, scope.decl.ref, scope.decl.ty))}</span>
            </div>
          );
          break;
      }
      scope = scope.parent;
    }
    return elems;
  };

  const recordingPanel = function () {
    return (
      <div className="row">
        <div className="col-md-12">
          <p>Liste des segments, bouton sur le dernier pour le supprimer,
             bouton sur chaque segment pour le lire.</p>
        </div>
      </div>);
  };

  self.render = function () {
    const {source, selection, isTranslated, stepperState, elapsed, eventCount, recorderState} = self.props;
    const {control, terminal, error, scope} = (stepperState || {});
    const haveNode = control && control.node;
    console.log('render');
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <div className="pane pane-controls">
              <h2>Contrôles</h2>
              <Button onClick={onPauseRecording}>
                <i className="fa fa-pause"/>
              </Button>
              <Button onClick={onStopRecording}>
                <i className="fa fa-stop"/>
              </Button>
              {isTranslated ?
                <div>
                  <Button onClick={onStepExpr} disabled={!haveNode}>step expr</Button>
                  <Button onClick={onStepInto} disabled={!haveNode}>step into</Button>
                  <Button onClick={onStepOut} disabled={true||!haveNode}>step out</Button>
                  <Button onClick={onRestart}>recommencer</Button>
                  <Button onClick={onEdit}>éditer</Button>
                </div>
              : <div>
                  <Button bsStyle='primary' onClick={onTranslate}>compiler</Button>
                </div>}
              {error && <p>{error}</p>}
              <p>Enregistrement : {Math.round(elapsed / 1000)}s, {eventCount} évènements</p>
            </div>
          </div>
        </div>
        {recorderState !== 'recording' && recordingPanel()}
        <div className="row">
          <div className="col-md-6">
            <div className="pane pane-source">
              <h2>Source C</h2>
              <Editor name="input_code" value={source} selection={selection} onChange={onSourceChange} onEdit={onSourceEdit} onSelect={onSourceSelect} readOnly={isTranslated} width='100%' height='336px'/>
            </div>
            {terminal &&
              <div className="pane pane-terminal">
                <h2>Terminal</h2>
                <Terminal terminal={terminal}/>
              </div>}
          </div>
        </div>
      </div>
    );
  };

});

function recordingScreenSelector (state, props) {
  const {recordingScreen, translated, recorder} = state;
  const {source, selection, stepperState} = recordingScreen;
  const eventCount = recorder.events.count();
  const {elapsed} = recorder;
  return {
    source, selection,
    stepperState,
    recorderState: recorder.state,
    isTranslated: !!translated,
    elapsed,
    eventCount
  };
};

export default connect(recordingScreenSelector)(RecordingScreen);
