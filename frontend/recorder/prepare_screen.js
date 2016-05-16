import Immutable from 'immutable';
import {take, put, select, call} from 'redux-saga/effects';
import React from 'react';
import {Button, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineAction, defineSelector, defineView, addReducer, addSaga} from '../utils/linker';
import Document from '../buffers/document';
import Editor from '../buffers/editor';

const startOfBuffer = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};

export default function* (deps) {

  yield use(
    'homeNewRecording', 'switchToScreen', 'recorderStart',
    'sourceReset', 'sourceInit', 'sourceEdit', 'sourceSelect', 'sourceScroll',
    'inputReset', 'inputInit', 'inputEdit', 'inputSelect', 'inputScroll'
  );

  yield defineAction('prepareScreenInit', 'Prepare.Init');
  yield defineAction('prepareScreenExampleSelected', 'Prepare.Example.Selected');

  function getExamples (state) {
    return state.getIn(['prepare', 'examples']);
  }

  // No reducer for prepareScreenExampleSelected, the saga watchExampleSelected
  // calls editor.reset which triggers edit/select events that will update the
  // state.

  yield addSaga(function* watchNewRecording () {
    while (true) {
      yield take(deps.homeNewRecording);
      const examples = yield select(getExamples);
      yield call(loadExample, examples[0]);
      yield put({type: deps.switchToScreen, screen: 'prepare'});
    }
  });

  function* loadExample (example) {
    const sourceModel = Immutable.Map({
      document: Document.fromString(example.source),
      selection: example.selection || startOfBuffer,
      scrollTop: example.scrollTop || 0
    });
    yield put({type: deps.sourceReset, model: sourceModel});
    const inputModel = Immutable.Map({
      document: Document.fromString(example.input || ""),
      selection: startOfBuffer,
      scrollTop: 0
    });
    yield put({type: deps.inputReset, model: inputModel});
  }

  yield addSaga(function* watchExampleSelected () {
    while (true) {
      const {example} = yield take(deps.prepareScreenExampleSelected);
      yield call(loadExample, example);
    }
  });

  yield defineSelector('PrepareScreenSelector', function (state, props) {
    const examples = getExamples(state);
    return {examples};
  });

  yield defineView('PrepareScreen', 'PrepareScreenSelector', EpicComponent(self => {

    const onSelectExample = function (event, i) {
      const example = self.props.examples[i];
      self.props.dispatch({type: deps.prepareScreenExampleSelected, example});
    };

    const onStartRecording = function () {
      self.props.dispatch({type: deps.recorderStart});
    };

    const onSourceInit = function (editor) {
      self.props.dispatch({type: deps.sourceInit, editor});
    };

    const onSourceEdit = function (delta) {
      self.props.dispatch({type: deps.sourceEdit, delta});
    };

    const onSourceSelect = function (selection) {
      self.props.dispatch({type: deps.sourceSelect, selection});
    };

    const onSourceScroll = function (scrollTop) {
      self.props.dispatch({type: deps.sourceScroll, scrollTop});
    };

    const onInputInit = function (editor) {
      self.props.dispatch({type: deps.inputInit, editor});
    };

    const onInputEdit = function (delta) {
      self.props.dispatch({type: deps.inputEdit, delta});
    };

    const onInputSelect = function (selection) {
      self.props.dispatch({type: deps.inputSelect, selection});
    };

    const onInputScroll = function (scrollTop) {
      self.props.dispatch({type: deps.inputScroll, scrollTop});
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
                  onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect} onScroll={onInputScroll}
                  mode='c_cpp' width='100%' height='280px' />
                <p>Entrée :</p>
                <Editor
                  onInit={onInputInit} onEdit={onInputEdit} onSelect={onInputSelect} onScroll={onInputScroll}
                  mode='c_cpp' width='100%' height='168px' />
              </div>
            </div>
          </div>
        </div>
      );
    };

  }));

};
