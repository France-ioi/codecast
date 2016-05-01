
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

export default actions => EpicComponent(self => {

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
