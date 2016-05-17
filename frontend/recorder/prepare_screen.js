
import {take, put} from 'redux-saga/effects';
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineAction, defineSelector, defineView, addSaga} from '../utils/linker';
import Editor from '../buffers/editor';

export default function* (deps) {

  yield use(
    'homeNewRecording', 'switchToScreen', 'recorderStart',
    'sourceInit', 'sourceEdit', 'sourceSelect', 'sourceScroll',
    'inputInit', 'inputEdit', 'inputSelect', 'inputScroll',
    'ExamplePicker', 'exampleSelected'
  );

  yield defineAction('prepareScreenInit', 'Prepare.Init');

  yield addSaga(function* watchNewRecording () {
    while (true) {
      yield take(deps.homeNewRecording);
      yield put({type: deps.exampleSelected, example: 0});
      yield put({type: deps.switchToScreen, screen: 'prepare'});
    }
  });

  yield defineSelector('PrepareScreenSelector', function (state, props) {
    return {};
  });

  yield defineView('PrepareScreen', 'PrepareScreenSelector', EpicComponent(self => {

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
                <deps.ExamplePicker/>
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
