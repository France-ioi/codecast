
import Immutable from 'immutable';
import {take, put, select} from 'redux-saga/effects';
import React from 'react';
import {Button, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineAction, defineSelector, defineView, addReducer, addSaga} from '../utils/linker';
import Document from '../utils/document';
import Editor from '../utils/editor';

const startOfBuffer = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};

export default function* (deps) {

  yield use('homeNewRecording', 'switchToScreen', 'recorderStart');

  yield defineAction('prepareScreenInit', 'Prepare.Init');
  yield defineAction('prepareScreenSourceInit', 'Prepare.Source.Init');
  yield defineAction('prepareScreenSourceEdit', 'Prepare.Source.Edit');
  yield defineAction('prepareScreenSourceSelect', 'Prepare.Source.Select');
  yield defineAction('prepareScreenSourceScroll', 'Prepare.Source.Scroll');
  yield defineAction('prepareScreenExampleSelected', 'Prepare.Example.Selected');

  yield defineSelector('getPreparedSource', state =>
    state.getIn(['prepare', 'source'])
  );

  yield defineSelector('getPreparedInput', state =>
    state.getIn(['prepare', 'input'])
  );

  yield addReducer('prepareScreenInit', function (state, action) {
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

  yield addReducer('prepareScreenSourceInit', function (state, action) {
    return state.setIn(['prepare', 'source', 'editor'], action.editor);
  });

  yield addReducer('prepareScreenSourceEdit', function (state, action) {
    const prevSource = state.getIn(['prepare', 'source', 'document']);
    const source = Document.applyDelta(prevSource, action.delta);
    return state.setIn(['prepare', 'source', 'document'], source);
  });

  yield addReducer('prepareScreenSourceSelect', function (state, action) {
    return state.setIn(['prepare', 'source', 'selection'], action.selection);
  });

  yield addReducer('prepareScreenSourceScroll', function (state, action) {
    return state.setIn(['prepare', 'source', 'scrollTop'], action.scrollTop);
  });

  // No reducer for prepareScreenExampleSelected, the saga watchExampleSelected
  // calls editor.reset which triggers edit/select events that will update the
  // state.

  yield addSaga(function* watchNewRecording () {
    // XXX move to home screen?
    while (true) {
      yield take(deps.homeNewRecording);
      yield put({type: deps.prepareScreenInit});
      yield put({type: deps.switchToScreen, screen: 'prepare'});
    }
  });

  yield addSaga(function* watchSourceInit () {
    while (true) {
      const {editor} = yield take(deps.prepareScreenSourceInit);
      if (editor) {
        const source = yield select(deps.getPreparedSource);
        const text = Document.toString(source.get('document'));
        const selection = source.get('selection');
        editor.reset(text, selection);
      }
    }
  });

  yield addSaga(function* watchExampleSelected () {
    while (true) {
      const {example} = yield take(deps.prepareScreenExampleSelected);
      const source = yield select(deps.getPreparedSource);
      const editor = source.get('editor');
      if (editor) {
        const text = example.source;
        const selection = example.selection || {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
        editor.reset(text, selection);
      }
    }
  });

  yield defineSelector('PrepareScreenSelector', function (state, props) {
    const examples = state.getIn(['prepare', 'examples']);
    return {examples};
  });

  yield defineView('PrepareScreen', 'PrepareScreenSelector', EpicComponent(self => {

    const onSourceInit = function (editor) {
      self.props.dispatch({type: deps.prepareScreenSourceInit, editor});
    };

    const onSourceEdit = function (delta) {
      self.props.dispatch({type: deps.prepareScreenSourceEdit, delta});
    };

    const onSourceSelect = function (selection) {
      self.props.dispatch({type: deps.prepareScreenSourceSelect, selection});
    };

    const onSourceScroll = function (scrollTop) {
      self.props.dispatch({type: deps.prepareScreenSourceScroll, scrollTop});
    };

    const onSelectExample = function (event, i) {
      const example = self.props.examples[i];
      self.props.dispatch({type: deps.prepareScreenExampleSelected, example});
    };

    const onStartRecording = function () {
      self.props.dispatch({type: deps.recorderStart});
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
