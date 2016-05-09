
import React from 'react';
import {Button, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import Editor from '../../utils/editor';
import Document from '../../utils/document';

export default function (m) {

  const {actions} = m;

  m.view('PrepareScreen', EpicComponent(self => {

    const onSourceInit = function (editor) {
      self.props.dispatch({type: actions.prepareScreenSourceInit, editor});
    };

    const onSelectExample = function (event, i) {
      const example = self.props.examples[i];
      self.props.dispatch({type: actions.prepareScreenExampleSelected, example});
    };

    const onSourceEdit = function (delta) {
      self.props.dispatch({type: actions.prepareScreenSourceEdit, delta});
    };

    const onSourceSelect = function (selection) {
      self.props.dispatch({type: actions.prepareScreenSourceSelect, selection});
    };

    const onSourceScroll = function (scrollTop) {
      self.props.dispatch({type: actions.prepareScreenSourceScroll, scrollTop});
    };

    const onStartRecording = function () {
      self.props.dispatch({type: actions.recorderStart});
    };

    self.render = function () {
      const {examples} = self.props;
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
                <Nav bsStyle="pills" className="pull-right">
                  <NavDropdown title="Exemples" id="nav-examples">
                    {examples.map((example, i) => <MenuItem key={i} eventKey={i} onSelect={onSelectExample}>{example.title}</MenuItem>)}
                  </NavDropdown>
                </Nav>
                <p>
                  Cet éditeur contient le code source avec lequel démarre
                  l'enregistrement.  La position du curseur et la sélection
                  sont aussi conservées.
                </p>
                <Editor
                  onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect}
                  width='100%' height='336px' mode='c_cpp'/>
              </div>
            </div>
          </div>
        </div>
      );
    };

  }));

};
