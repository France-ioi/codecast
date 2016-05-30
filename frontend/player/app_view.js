
import React from 'react';
import EpicComponent from 'epic-component';

import {use, defineView, defineSelector} from '../utils/linker';

export default function* (deps) {

  yield use('PlayerControls', 'MainView', 'getPlayerState');

  yield defineSelector('AppSelector', function (state, props) {
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const preventInput = !/ready|paused/.test(status);
    return {preventInput};
  });

  yield defineView('App', 'AppSelector', EpicComponent(self => {

    self.render = function () {
      const {preventInput} = self.props;
      return (
        <div className="container">
          <div className="row">
            <div className="col-sm-12">
              <deps.PlayerControls/>
            </div>
          </div>
          <deps.MainView preventInput={preventInput}/>
        </div>
      );
    };

  }));

};