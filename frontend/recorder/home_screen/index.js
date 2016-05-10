
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import {take, put} from 'redux-saga/effects';

export default function (m) {

  m.action('homeNewRecording', 'Home.NewRecording');

  m.saga(function* watchNewRecording () {
    while (true) {
      yield take(m.actions.homeNewRecording);
      yield put({type: m.actions.prepareScreenInit});
      yield put({type: m.actions.switchToScreen, screen: 'prepare'});
    }
  });

  m.view('HomeScreen', EpicComponent(self => {

    const onNewRecording = function () {
      self.props.dispatch({type: m.actions.homeNewRecording});
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
