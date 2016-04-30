
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
    self.props.dispatch({type: actions.sourceInit, editor});
  };

  const onSourceSelect = function (selection) {
    self.props.dispatch({type: actions.sourceSelect, selection});
  };

  const onSourceEdit = function (delta) {
    self.props.dispatch({type: actions.sourceEdit, delta});
  };

  const onInputInit = function (editor) {
    self.props.dispatch({type: actions.inputInit, editor});
  };

  const onInputSelect = function (selection) {
    self.props.dispatch({type: actions.inputSelect, selection});
  };

  const onInputEdit = function (delta) {
    self.props.dispatch({type: actions.inputEdit, delta});
  };

  const onTranslate = function () {
    self.props.dispatch({type: actions.translateSource});
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
    const {dispatch, recorderState, translate, eventCount, elapsed, stepperState, stepperDisplay} = self.props;
    const isRecording = recorderState === 'recording';
    const isStepping = !!stepperState;
    const isIdle = stepperState === 'idle';
    const {control, terminal, error, scope} = stepperDisplay;
    const haveNode = control && control.node;
    const diagnostics = translate && translate.get('diagnostics');
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <RecordControls dispatch={dispatch} isRecording={isRecording} isStepping={isStepping} haveNode={haveNode} elapsed={elapsed} eventCount={eventCount} onTranslate={onTranslate} />
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
        {diagnostics &&
          <div className="row">
            <div className="col-md-3"/>
            <div className="col-md-6">
              <div dangerouslySetInnerHTML={diagnostics}/>
            </div>
          </div>}
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
          </div>
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
  const source = state.get('source');
  const input = state.get('input');
  const recorder = state.get('recorder');
  const recorderState = recorder.get('state');
  const translate = recorder.get('translate');
  const eventCount = recorder.get('events').count();
  const elapsed = recorder.get('elapsed');
  const stepper = recorder.get('stepper')
  const stepperState = stepper && stepper.get('state');
  const stepperDisplay = stepper ? stepper.get('display', {}) : {};
  return {
    recorderState, source, input, translate, eventCount, elapsed,
    stepperState, stepperDisplay
  };
};

export default connect(selector)(RecordScreen);
