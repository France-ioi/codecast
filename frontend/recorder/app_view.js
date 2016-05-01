
import React from 'react';
import EpicComponent from 'epic-component';

import DevTools from '../common/dev_tools';

export default (actions, views) => EpicComponent(self => {

  self.render = function () {
    const {screen} = self.props;
    return (
      <div className="container">
        {screen === 'home' && <views.HomeScreen/>}
        {screen === 'prepare' && <views.PrepareScreen/>}
        {screen === 'record' && <views.RecordScreen/>}
        {screen === 'save' && <views.SaveScreen/>}
        {true && <DevTools/>}
        <canvas id="vumeter" width="10" height="100"></canvas>
      </div>
    );
  };

});
