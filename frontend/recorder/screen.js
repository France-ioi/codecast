
import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import Document from '../common/document';
import Terminal from '../common/terminal';
import Editor from '../common/editor';
import StackView from '../common/stack_view';
import DirectivesPane from '../common/directives_pane';

import actions from '../actions';
import {recordEventAction} from './utils';
import RecordControls from './controls';
import EventView from './event_view';

export const RecordScreen = EpicComponent(self => {

  const onSourceInit = function (editor) {
    self.props.dispatch({type: actions.recordScreenSourceInit, editor});
    if (editor) {
      const {source} = self.props;
      const value = Document.toString(source.get('document'));
      const selection = source.get('selection');
      editor.reset(value, selection);
    }
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

  const onInputInit = function (editor) {
    self.props.dispatch({type: actions.recordScreenInputInit, editor});
    if (editor) {
      const {input} = self.props;
      const value = Document.toString(input.get('document'));
      const selection = input.get('selection');
      editor.reset(value, selection);
    }
  };

  const onInputSelect = function (selection) {
    self.props.dispatch(recordEventAction(['input.select', Document.compressRange(selection)]));
    self.props.dispatch({type: actions.recordScreenInputSelect, selection});
  };

  const onInputEdit = function (delta) {
    const {start, end} = delta;
    const range = {start, end};
    if (delta.action === 'insert') {
      self.props.dispatch(recordEventAction(['input.insert', Document.compressRange(range), delta.lines]));
    } else {
      self.props.dispatch(recordEventAction(['input.delete', Document.compressRange(range)]));
    }
    self.props.dispatch({type: actions.recordScreenInputEdit, delta});
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
    const {dispatch, recorderState, source, events, elapsed, stepperState, stepperDisplay} = self.props;
    const isRecording = recorderState === 'recording';
    const isStepping = !!stepperState;
    const isIdle = stepperState === 'idle';
    const {control, terminal, error, scope} = stepperDisplay;
    const haveNode = control && control.node;
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <RecordControls dispatch={dispatch} isRecording={isRecording} isStepping={isStepping} haveNode={haveNode} elapsed={elapsed} eventCount={events.count()} onTranslate={onTranslate} />
            {error && <p>{error}</p>}
          </div>
        </div>
        <div className="row">
          {stepperDisplay && <div className="col-md-3">
            <h2>Pile</h2>
            <StackView state={stepperDisplay}/>
          </div>}
          <div className="col-md-6">
            <h2>Source C</h2>
            <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect}
                    readOnly={isStepping} mode='c_cpp' width='100%' height='336px' />
          </div>
          {terminal && <div className="col-md-3">
            <h2>Terminal</h2>
            <Terminal terminal={terminal}/>
          </div>}
        </div>
        <div className="row">
          {stepperDisplay && <div className="col-md-12">
            <h2>Vues</h2>
            <DirectivesPane state={stepperDisplay}/>
          </div>}
        </div>
        <div className="row">
          <div className="col-md-6">
            <h2>Entrée standard du programme</h2>
            <Editor onInit={onInputInit} onEdit={onInputEdit} onSelect={onInputSelect}
                    readOnly={isStepping} mode='text' width='100%' height='336px' />
          </div>}
        </div>
        <div className="row">
          {!isRecording && recordingPanel()}
          {false && <div className="col-md-12">
            <div className="dev-EventsPanel">
              {events.slice(-10).map(event => <EventView event={event}/>)}
            </div>
          </div>}
        </div>
      </div>
    );
  };

});

function selector (state, props) {
  const recorder = state.get('recorder');
  const recorderState = recorder.get('state');
  const source = recorder.get('source');
  const input = recorder.get('input');
  const events = recorder.get('events');
  const elapsed = recorder.get('elapsed');
  const stepper = recorder.get('stepper')
  const stepperState = stepper && stepper.get('state');
  const stepperDisplay = stepper ? stepper.get('display', {}) : {};
  return {
    recorderState, source, input, events, elapsed,
    stepperState, stepperDisplay,
  };
};

export default connect(selector)(RecordScreen);
