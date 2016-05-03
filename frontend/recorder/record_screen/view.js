
import React from 'react';
import {connect} from 'react-redux';
import {Button, Panel} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import Document from '../../common/document';
import Editor from '../../common/editor';
import StackView from '../../stepper/stack_view';
import DirectivesPane from '../../stepper/directives_pane';
import Terminal from '../../stepper/terminal';
import EventView from './event_view';

export default function (actions, views) {

  return EpicComponent(self => {

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
      self.props.dispatch({type: actions.translate});
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
      const {dispatch, recorderState, diagnostics, eventCount, elapsed, stepperState, stepperDisplay} = self.props;
      const isRecording = recorderState === 'recording';
      const isStepping = !!stepperState;
      const isIdle = stepperState === 'idle';
      const {control, terminal, error, scope} = stepperDisplay || {};
      const haveNode = control && control.node;
      return (
        <div>
          <div className="row">
            <div className="col-md-12">
              <views.RecorderControls dispatch={dispatch} isRecording={isRecording} isStepping={isStepping} haveNode={haveNode} elapsed={elapsed} eventCount={eventCount} onTranslate={onTranslate} />
              {error && <p>{error}</p>}
            </div>
          </div>
          <div className="row">
            <div className="col-md-3">
              <Panel header="Variables">
                {stepperDisplay && <StackView state={stepperDisplay} height='280px' />}
              </Panel>
            </div>
            <div className="col-md-9">
              <Panel header="Source">
                <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect}
                        readOnly={isStepping} mode='c_cpp' width='100%' height='280px' />
              </Panel>
            </div>
          </div>
          <div className="row">
            {diagnostics && <div className="col-md-12">
              <Panel header="Messages">
                <div dangerouslySetInnerHTML={diagnostics}/>
              </Panel>
            </div>}
            <div className="col-md-12">
              {stepperDisplay && <DirectivesPane state={stepperDisplay}/>}
              <Panel header="Entrée/Sortie">
                <div className="row">
                  <div className="col-md-6">
                    <Editor onInit={onInputInit} onEdit={onInputEdit} onSelect={onInputSelect}
                            readOnly={isStepping} mode='text' width='100%' height='168px' />
                  </div>
                  <div className="col-md-6">
                    {terminal
                      ? <Terminal terminal={terminal}/>
                      : <p>Programme arrêté, pas de sortie à afficher.</p>}
                  </div>
                </div>
              </Panel>
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

};
