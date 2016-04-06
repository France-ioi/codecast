
import React from 'react';
import {connect} from 'react-redux';
import EpicComponent from 'epic-component';

export const SaveScreen = EpicComponent(self => {

  self.render = function () {
    const {source} = self.props;
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
  const {audioUrl, events} = state.screens.save;
  return {audioUrl, events};
};

export default connect(selector)(SaveScreen);
