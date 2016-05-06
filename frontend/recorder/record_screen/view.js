
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

    const onSourceScroll = function (scrollTop, firstVisibleRow) {
      self.props.dispatch({type: actions.sourceScroll, scrollTop, firstVisibleRow});
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

    const onInputScroll = function (scrollTop, firstVisibleRow) {
      self.props.dispatch({type: actions.inputScroll, scrollTop, firstVisibleRow});
    };

    const recordingPanel = function () {
      return (
        <div className="row">
          <div className="col-md-12">
            <p>Encodage en cours, veuillez patienter.</p>
          </div>
        </div>);
    };

    self.render = function () {
      const {isRecording, diagnostics, haveStepper, terminal} = self.props;
      return (
        <div>
          <div className="row">
            <div className="col-md-12">
              <views.RecorderControls/>
            </div>
          </div>
          <div className="row">
            <div className="col-md-3">
              <Panel header="Variables">
                {<views.StackView height='280px'/>}
              </Panel>
            </div>
            <div className="col-md-9">
              <Panel header="Source">
                <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect} onScroll={onSourceScroll}
                        readOnly={haveStepper} mode='c_cpp' width='100%' height='280px' />
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
              <views.DirectivesPane/>
              <Panel header="Entrée/Sortie">
                <div className="row">
                  <div className="col-md-6">
                    <Editor onInit={onInputInit} onEdit={onInputEdit} onSelect={onInputSelect} onScroll={onInputScroll}
                            readOnly={haveStepper} mode='text' width='100%' height='168px' />
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
        </div>
      );
    };

  });

};
