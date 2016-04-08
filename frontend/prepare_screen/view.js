
import React from 'react';
import {connect} from 'react-redux';
import AceEditor from 'react-ace';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import * as ace from 'brace';
const Range = ace.acequire('ace/range').Range;

import actions from '../actions';
import Editor from '../editor';
import Document from '../common/document';

export const PrepareScreen = EpicComponent(self => {

  let editor;

  const onSourceInit = function () {
    const {source} = self.props;
    const value = Document.toString(source.get('document'));
    const selection = source.get('selection'); // XXX
    return {value, selection};
  };

  const onSourceEdit = function (delta) {
    self.props.dispatch({type: actions.prepareScreenSourceEdit, delta});
  };

  const onSourceSelect = function (selection) {
    self.props.dispatch({type: actions.prepareScreenSourceSelect, selection});
  };

  const onStartRecording = function () {
    self.props.dispatch({type: actions.recorderStart});
  };

  self.render = function () {
    const {source} = self.props;
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <div className="pane pane-controls">
              <p>
                <Button onClick={onStartRecording} className="float-left">
                  <i className="fa fa-circle" style={{color: '#a01'}}/>
                </Button>
                {" démarrer l'enregistrement"}
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="pane pane-source">
              <h2>Source C initial</h2>
              <p>
                Cet éditeur contient le code source avec lequel démarre
                l'enregistrement.  La position du curseur et la sélection
                sont aussi conservées.
              </p>
              <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect} width='100%' height='336px'
                      selection={source.get('selection')}/>
            </div>
          </div>
        </div>
      </div>
    );
  };

});

function selector (state, props) {
  const source = state.get('prepare').get('source');
  return {source};
};

export default connect(selector)(PrepareScreen);
