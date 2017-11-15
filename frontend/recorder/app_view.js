
import React from 'react';
import {Button} from 'react-bootstrap';

export default function (bundle, deps) {

  bundle.use('ErrorView', 'LoginScreen', 'RecordScreen', 'SaveScreen', 'MemoryUsage');

  bundle.defineView('RecorderApp', RecorderAppSelector, class RecorderApp extends React.PureComponent {
    render () {
      let {user, size, screen} = this.props;
      if (!user) screen = 'login';
      return (
        <div className={`container size-${size}`}>
          <deps.ErrorView/>
          {screen === 'login' && <deps.LoginScreen/>}
          {screen === 'record' && <deps.RecordScreen/>}
          {screen === 'save' && <deps.SaveScreen/>}
          <canvas id="vumeter" width="10" height="100"></canvas>
          <deps.MemoryUsage/>
        </div>
      );
    };

  });

  function RecorderAppSelector (state, props) {
    const user = state.get('user');
    const size = state.get('size');
    const screen = state.get('screen');
    return {user, size, screen};
  }

};
