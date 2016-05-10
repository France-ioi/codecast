
import React from 'react';
import EpicComponent from 'epic-component';

import {use, defineView} from '../utils/linker';

export default function* (deps) {

  yield use('RecorderControls', 'MainView');

  yield defineView('RecordScreen', EpicComponent(self => {

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
              <deps.RecorderControls/>
            </div>
          </div>
          <deps.MainView/>
        </div>
      );
    };

  }));

};
