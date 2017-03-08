
import React from 'react';
import EpicComponent from 'epic-component';

export default function (bundle, deps) {

  bundle.use('RecorderControls', 'MainView');

  bundle.defineView('RecordScreen', EpicComponent(self => {

    const recordingPanel = function () {
      return (
        <div className="row">
          <div className="col-sm-12">
            <p>Encodage en cours, veuillez patienter.</p>
          </div>
        </div>);
    };

    self.render = function () {
      return (
        <div>
          <div className="row">
            <div className="col-sm-12">
              <deps.RecorderControls/>
            </div>
          </div>
          <deps.MainView/>
        </div>
      );
    };

  }));

};
