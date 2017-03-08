
import React from 'react';
import EpicComponent from 'epic-component';

import DevTools from '../utils/dev_tools';

export default function (bundle, deps) {

  bundle.use('ErrorView', 'RecordScreen', 'SaveScreen');

  bundle.defineSelector('AppSelector', function (state, props) {
    const size = state.get('size');
    const screen = state.get('screen');
    return {size, screen};
  });

  bundle.defineView('App', 'AppSelector', EpicComponent(self => {

    self.render = function () {
      const {size, screen} = self.props;
      return (
        <div className={`container size-${size}`}>
          <deps.ErrorView/>
          {screen === 'record' && <deps.RecordScreen/>}
          {screen === 'save' && <deps.SaveScreen/>}
          {false && <DevTools/>}
          <canvas id="vumeter" width="10" height="100"></canvas>
        </div>
      );
    };

  }));

};
