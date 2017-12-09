
import React from 'react';

class RecorderApp extends React.PureComponent {
  render () {
    const {Screen, ErrorView, MemoryUsage, Vumeter} = this.props;
    return (
      <div>
        <Screen/>
        <ErrorView/>
        <MemoryUsage/>
        <Vumeter/>
      </div>
    );
  }
}

export default function (bundle, deps) {

  bundle.use('ErrorView', 'LoginScreen', 'RecordScreen', 'SaveScreen', 'MemoryUsage', 'Vumeter');

  bundle.defineView('RecorderApp', RecorderAppSelector, RecorderApp);

  function RecorderAppSelector (state, props) {
    const {ErrorView, RecorderControls, MainView, MemoryUsage} = deps;
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
    return {Screen, ErrorView, MemoryUsage, Vumeter};
  }

};
