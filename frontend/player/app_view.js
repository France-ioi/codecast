
import React from 'react';
import EpicComponent from 'epic-component';

export default function (bundle, deps) {

  bundle.use('PlayerControls', 'MainView', 'getPlayerState');

  bundle.defineSelector('AppSelector', function (state, props) {
    const size = state.get('size');
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const preventInput = !/ready|paused/.test(status);
    return {preventInput, size};
  });

  bundle.defineView('App', 'AppSelector', EpicComponent(self => {

    self.render = function () {
      const {preventInput, size} = self.props;
      return (
        <div className={`container size-${size}`}>
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