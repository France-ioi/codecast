
import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import actions from '../actions';

export const SaveScreen = EpicComponent(self => {

  const noAction = function (event) {
    event.preventDefault();
  };

  const onUpload = function () {
    self.props.dispatch({type: actions.saveScreenUploadStart});
  };

  self.render = function () {
    const {audioUrl, eventsUrl} = self.props;
    return (
      <div>
        <p><Button onClick={onUpload}>enregistrer</Button></p>
        <p>
          <a className="btn btn-default" href={audioUrl} onClick={noAction}>
            <i className="fa fa-file-audio-o"/>
          </a>
        </p>
        <p>
          <a className="btn btn-default" href={eventsUrl} onClick={noAction}>
            <i className="fa fa-file-video-o"/>
          </a>
        </p>
      </div>
    );
  };

});

function selector (state, props) {
  const save = state.get('save')
  const audioUrl = save.get('audioUrl');
  const eventsUrl = save.get('eventsUrl');
  return {audioUrl, eventsUrl};
};

export default connect(selector)(SaveScreen);
