
import React from 'react';
import {connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

export const SaveScreen = EpicComponent(self => {

  const noAction = function (event) {
    event.preventDefault();
  };

  self.render = function () {
    const {audioUrl, eventsUrl} = self.props;
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <a className="btn btn-default" href={audioUrl} onClick={noAction}>
              <i className="fa fa-file-audio-o"/>
            </a>
            <a className="btn btn-default" href={eventsUrl} onClick={noAction}>
              <i className="fa fa-file-video-o"/>
            </a>
          </div>
        </div>
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
