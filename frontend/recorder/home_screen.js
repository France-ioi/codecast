
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import {take, put} from 'redux-saga/effects';
import {use, defineAction, defineSelector, defineView, addSaga} from '../utils/linker';

export default function* (deps) {

  yield defineAction('homeNewRecording', 'Home.NewRecording');

  yield use('homeNewRecording', 'prepareScreenInit', 'switchToScreen');

  yield addSaga(function* watchNewRecording () {
    while (true) {
      yield take(deps.homeNewRecording);
      yield put({type: deps.prepareScreenInit});
      yield put({type: deps.switchToScreen, screen: 'prepare'});
    }
  });

  yield defineSelector('HomeScreenSelector', function (state, props) {
    return {};
  });

  yield defineView('HomeScreen', 'HomeScreenSelector', EpicComponent(self => {

    const onNewRecording = function () {
      self.props.dispatch({type: deps.homeNewRecording});
    };

    self.render = function () {
      return (
        <div>
          <div className="row">
            <div className="col-md-12">
              <Button onClick={onNewRecording} className="float-left">
                <i className="fa fa-circle" style={{color: '#a01'}}/>
                {' nouvel enregistrement'}
              </Button>
              <p>...liste des enregistrements...</p>
            </div>
          </div>
        </div>
      );
    };

  }));

};
