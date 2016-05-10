
import Immutable from 'immutable';
import {take, put, select} from 'redux-saga/effects';
import React from 'react';
import {Button, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import Document from '../utils/document';
import Editor from '../utils/editor';

const startOfBuffer = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};

export default function (m) {

  m.action('prepareScreenInit', 'Prepare.Init');
  m.action('prepareScreenSourceInit', 'Prepare.Source.Init');
  m.action('prepareScreenSourceEdit', 'Prepare.Source.Edit');
  m.action('prepareScreenSourceSelect', 'Prepare.Source.Select');
  m.action('prepareScreenSourceScroll', 'Prepare.Source.Scroll');
  m.action('prepareScreenExampleSelected', 'Prepare.Example.Selected');

  m.selector('getPreparedSource', state =>
    state.getIn(['prepare', 'source'])
  );

  m.selector('getPreparedInput', state =>
    state.getIn(['prepare', 'input'])
  );

  m.reducer('prepareScreenInit', function (state, action) {
    const examples = state.getIn(['prepare', 'examples']);
    const initialDocument = Document.fromString(examples[0].source);
    const initialSource = Immutable.Map({
      document: initialDocument,
      selection: startOfBuffer,
      scrollTop: 0
    });
    const initialInput = Immutable.Map({
      document: Document.fromString(""),
      selection: startOfBuffer,
      scrollTop: 0
    });
    return state.update('prepare', prepare => prepare
      .set('source', initialSource)
      .set('input', initialInput));
  });

  m.reducer('prepareScreenSourceInit', function (state, action) {
    return state.setIn(['prepare', 'source', 'editor'], action.editor);
  });

  m.reducer('prepareScreenSourceEdit', function (state, action) {
    const prevSource = state.getIn(['prepare', 'source', 'document']);
    const source = Document.applyDelta(prevSource, action.delta);
    return state.setIn(['prepare', 'source', 'document'], source);
  });

  m.reducer('prepareScreenSourceSelect', function (state, action) {
    return state.setIn(['prepare', 'source', 'selection'], action.selection);
  });

  m.reducer('prepareScreenSourceScroll', function (state, action) {
    return state.setIn(['prepare', 'source', 'scrollTop'], action.scrollTop);
  });

  // No reducer for prepareScreenExampleSelected, the saga watchExampleSelected
  // calls editor.reset which triggers edit/select events that will update the
  // state.

  m.saga(function* watchNewRecording () {
    // XXX move to home screen?
    while (true) {
      yield take(m.actions.homeNewRecording);
      yield put({type: m.actions.prepareScreenInit});
      yield put({type: m.actions.switchToScreen, screen: 'prepare'});
    }
  });

  m.saga(function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(m.actions.prepareScreenSourceInit);
      if (editor) {
        const source = yield select(m.selectors.getPreparedSource);
        const text = Document.toString(source.get('document'));
        const selection = source.get('selection');
        editor.reset(text, selection);
      }
    }
  });

  m.saga(function* watchExampleSelected () {
    while (true) {
      const {example} = yield take(m.actions.prepareScreenExampleSelected);
      const source = yield select(m.selectors.getPreparedSource);
      const editor = source.get('editor');
      if (editor) {
        const text = example.source;
        const selection = example.selection || {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
        editor.reset(text, selection);
      }
    }
  });

  m.selector('PrepareScreen', function (state, props) {
    const examples = state.getIn(['prepare', 'examples']);
    return {examples};
  });

  m.view('PrepareScreen', EpicComponent(self => {

    const onSourceInit = function (editor) {
      self.props.dispatch({type: m.actions.prepareScreenSourceInit, editor});
    };

    const onSourceEdit = function (delta) {
      self.props.dispatch({type: m.actions.prepareScreenSourceEdit, delta});
    };

    const onSourceSelect = function (selection) {
      self.props.dispatch({type: m.actions.prepareScreenSourceSelect, selection});
    };

    const onSourceScroll = function (scrollTop) {
      self.props.dispatch({type: m.actions.prepareScreenSourceScroll, scrollTop});
    };

    const onSelectExample = function (event, i) {
      const example = self.props.examples[i];
      self.props.dispatch({type: m.actions.prepareScreenExampleSelected, example});
    };

    const onStartRecording = function () {
      self.props.dispatch({type: m.actions.recorderStart});
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
