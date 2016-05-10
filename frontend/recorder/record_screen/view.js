
import React from 'react';
import EpicComponent from 'epic-component';

export default function (m) {

  m.view('RecordScreen', EpicComponent(self => {

    const recordingPanel = function () {
      return (
        <div className="row">
          <div className="col-md-12">
            <p>Encodage en cours, veuillez patienter.</p>
          </div>
        </div>);
    };

    self.render = function () {
      return (
        <div>
          <div className="row">
            <div className="col-md-12">
              <m.views.RecorderControls/>
            </div>
          </div>
          <m.views.MainView/>
        </div>
      );
    };

  }));

};
