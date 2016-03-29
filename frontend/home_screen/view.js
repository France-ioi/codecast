
import React from 'react';
import {connect} from 'react-redux';
import AceEditor from 'react-ace';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import * as ace from 'brace';
const Range = ace.acequire('ace/range').Range;

import actions from '../actions';

export const HomeScreen = EpicComponent(self => {

  let editor;

  const onSourceLoad = function (editor_) {
    editor = editor_;
    editor.$blockScrolling = Infinity;
    editor.selection.addEventListener("changeCursor", function () {
      var range = editor.selection.getRange();
      self.props.dispatch({type: actions.homeSourceSelectionChanged, range});
    }, true);
    editor.selection.addEventListener("changeSelection", function () {
      var range = editor.selection.getRange();
      self.props.dispatch({type: actions.homeSourceSelectionChanged, range});
    }, true);
    const {selection} = self.props;
    if (selection) {
      editor.selection.setRange(new Range(
        selection.start.row, selection.start.column,
        selection.end.row, selection.end.column));
    }
    editor.focus();
  };

  const onSourceChange = function (source) {
    self.props.dispatch({type: actions.homeSourceTextChanged, source});
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
            <div className="pane pane-source">
              <h2>Source C initial</h2>
              <p>
                Cet éditeur contient le code source avec lequel démarre
                l'enregistrement.  La position du curseur et la sélection
                sont aussi conservées.
              </p>
              <AceEditor mode="c_cpp" theme="github" name="input_code" value={source}
                onLoad={onSourceLoad} onChange={onSourceChange} width='100%' height='336px'/>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="pane pane-controls">
              <h2>Contrôles</h2>
              <p>
                <Button onClick={onStartRecording} className="float-left">
                  <i className="fa fa-circle" style={{color: '#a01'}}/>
                </Button>
                {" démarrer l'enregistrement"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

});

function homeScreenSelector (state, props) {
  const {source, selection} = state.home;
  return {source, selection};
};

export default connect(homeScreenSelector)(HomeScreen);
