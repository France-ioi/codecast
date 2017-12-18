
import React from 'react';

class RecorderApp extends React.PureComponent {
  render () {
    const {LogoutButton, FullscreenButton, Screen, ErrorView, MemoryUsage, Vumeter} = this.props;
    return (
      <div className='container'>
        <LogoutButton/>
        <FullscreenButton/>
        <Screen/>
        <ErrorView/>
        <MemoryUsage/>
        <Vumeter/>
      </div>
    );
  }
}

export default function (bundle, deps) {

  bundle.use('LoginScreen', 'RecordScreen', 'SaveScreen', 'ErrorView', 'MemoryUsage', 'Vumeter');

  bundle.defineView('RecorderApp', RecorderAppSelector, RecorderApp);

  function RecorderAppSelector (state, props) {
    const {LogoutButton, FullscreenButton, ErrorView, MemoryUsage, Vumeter} = deps;
    const user = state.get('user');
    const screen = state.get('screen');
    let Screen;
    if (!user) {
      Screen = deps.LoginScreen;
    } else if (screen === 'record') {
      Screen = deps.RecordScreen;
    } else if (screen === 'save') {
      Screen = deps.SaveScreen;
    }
    return {LogoutButton, FullscreenButton, Screen, ErrorView, MemoryUsage, Vumeter};
  }

};
