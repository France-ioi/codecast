
import React from 'react';
import {Button} from 'react-bootstrap';

export default function (bundle, deps) {

  bundle.use('ErrorView', 'LoginScreen', 'RecordScreen', 'SaveScreen');

  bundle.defineView('RecorderApp', RecorderAppSelector, class RecorderApp extends React.PureComponent {
    render () {
      const {user, size, screen} = this.props;
      if (!user) return <deps.LoginScreen/>;
      return (
        <div className={`container size-${size}`}>
          <deps.ErrorView/>
          {screen === 'record' && <deps.RecordScreen/>}
          {screen === 'save' && <deps.SaveScreen/>}
          <canvas id="vumeter" width="10" height="100"></canvas>
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
