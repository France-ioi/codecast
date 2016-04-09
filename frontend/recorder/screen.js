
import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import Document from '../common/document';
import Terminal from '../common/terminal';
import Editor from '../common/editor';

import actions from '../actions';
import {recordEventAction} from './utils';
import RecordControls from './controls';
import EventView from './event_view';

export const RecordScreen = EpicComponent(self => {

  const onSourceInit = function () {
    const {source} = self.props;
    const value = Document.toString(source.get('document'));
    const selection = source.get('selection');
    return {value, selection};
  };

  const onSourceSelect = function (selection) {
    self.props.dispatch(recordEventAction(['select', Document.compressRange(selection)]));
    self.props.dispatch({type: actions.recordScreenSourceSelect, selection});
  };

  const onSourceEdit = function (delta) {
    const {start, end} = delta;
    const range = {start, end};
    if (delta.action === 'insert') {
      self.props.dispatch(recordEventAction(['insert', Document.compressRange(range), delta.lines]));
    } else {
      self.props.dispatch(recordEventAction(['delete', Document.compressRange(range)]));
    }
    self.props.dispatch({type: actions.recordScreenSourceEdit, delta});
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

  const onTranslate = function () {
    const {source} = self.props;
    const text = Document.toString(source.get('document'));
    self.props.dispatch({
      type: actions.translateSource,
      language: 'c',
      source: text
    });
  };

  self.render = function () {
    const {dispatch, recorderState, source, isTranslated, events, elapsed, stepperState, stepperDisplay} = self.props;
    const isRecording = recorderState === 'recording';
    const isIdle = stepperState === 'idle';
    const selection = source.get('selection');
    const {control, terminal, error, scope} = stepperDisplay;
    const haveNode = control && control.node;
    // XXX Editor readOnly is not supported yet
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <RecordControls dispatch={dispatch} isRecording={isRecording} isTranslated={isTranslated} haveNode={haveNode} elapsed={elapsed} eventCount={events.count()} onTranslate={onTranslate} />
            {error && <p>{error}</p>}
          </div>
        </div>
        {!isRecording && recordingPanel()}
        <div className="row">
          <div className="col-md-6">
            <div className="pane pane-source">
              <h2>Source C</h2>
              <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect}
                      readOnly={isTranslated} width='100%' height='336px' selection={selection}/>
            </div>
          </div>
          {terminal && <div className="col-md-6">
            <h2>Terminal</h2>
            <Terminal terminal={terminal}/>
          </div>}
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="dev-EventsPanel">
              {events.slice(-10).map(event => <EventView event={event}/>)}
            </div>
          </div>
        </div>
      </div>
    );
  };

});

function selector (state, props) {
  const recorder = state.get('recorder');
  const recorderState = recorder.get('state');
  const source = recorder.get('source');
  const isTranslated = !!recorder.get('translated');
  const events = recorder.get('events');
  const elapsed = recorder.get('elapsed');
  const stepperState = recorder.getIn(['stepper', 'state']);
  const stepperDisplay = recorder.getIn(['stepper', 'display'], {});
  return {
    recorderState, source, isTranslated, events, elapsed,
    stepperState, stepperDisplay,
  };
};

export default connect(selector)(RecordScreen);
