
import React from 'react';
import EpicComponent from 'epic-component';

import {use, defineView} from '../utils/linker';

export default function* (deps) {

  yield use('PlayerControls', 'MainView');

  yield defineView('App', EpicComponent(self => {

    self.render = function () {
      return (
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <deps.PlayerControls/>
            </div>
          </div>
          <deps.MainView/>
        </div>
      );
    };

  }));

};