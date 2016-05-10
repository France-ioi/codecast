
import React from 'react';
import EpicComponent from 'epic-component';

import DevTools from '../utils/dev_tools';

export default function (m) {

  const {views} = m;

  m.selector('App', function (state, props) {
    const screen = state.get('screen');
    return {screen};
  });

  m.view('App', EpicComponent(self => {

    self.render = function () {
      const {screen} = self.props;
      return (
        <div className="container">
          {screen === 'home' && <views.HomeScreen/>}
          {screen === 'prepare' && <views.PrepareScreen/>}
          {screen === 'record' && <views.RecordScreen/>}
          {screen === 'save' && <views.SaveScreen/>}
          {false && <DevTools/>}
          <canvas id="vumeter" width="10" height="100"></canvas>
        </div>
      );
    };

  }));

};
