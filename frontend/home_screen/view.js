
import React from 'react';
import {connect} from 'react-redux';
import AceEditor from 'react-ace';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import * as ace from 'brace';
const Range = ace.acequire('ace/range').Range;

import {getHomeScreenState} from '../selectors';
import actions from '../actions';

export const HomeScreen = EpicComponent(self => {

  const onNewRecording = function () {
    self.props.dispatch({type: actions.homeNewRecording});
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

});

function selector (state, props) {
  const screen = getHomeScreenState(state);
  return {};
};

export default connect(selector)(HomeScreen);
