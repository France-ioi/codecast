
import React from 'react';
import classnames from 'classnames';

class RecorderApp extends React.PureComponent {
  render () {
    const {RecorderGlobalControls, Screen, MemoryUsage, Vumeter} = this.props;
    return (
      <div className='container'>
        <RecorderGlobalControls/>
        <div id='page-level-controls'>
          <div>
            <MemoryUsage/>
            <Vumeter/>
          </div>
        </div>
        <Screen/>
      </div>
    );
  }
}

function RecorderAppSelector (state, props) {
  const scope = state.get('scope');
  const {MemoryUsage, Vumeter, RecorderGlobalControls} = scope;
  const user = state.get('user');
  const screen = state.get('screen');
  let Screen;
  if (!user) {
    Screen = scope.LoginScreen;
  } else if (screen === 'record') {
    Screen = scope.RecordScreen;
  } else if (screen === 'save') {
    Screen = scope.SaveScreen;
  }
  return {Screen, MemoryUsage, Vumeter, RecorderGlobalControls};
}

function RecorderGlobalControlsSelector (state) {
  const {LogoutButton} = state.get('scope');
  return {LogoutButton};
}

class RecorderGlobalControls extends React.PureComponent {
  render () {
    const {LogoutButton} = this.props;
    const {collapsed} = this.state;
    return (
      <div id='floating-controls' className={classnames({collapsed})}>
        <span className='collapse-toggle' onClick={this._toggleCollapsed}>
          <i className={`fa fa-chevron-${collapsed ? 'down' : 'up'}`}/>
        </span>
        <div className='btn-group'>
          <LogoutButton/>
        </div>
      </div>
    );
  }
  state = {collapsed: false};
  _toggleCollapsed = () => {
    const {collapsed} = this.state;
    this.setState({collapsed: !collapsed});
  };
}

export default function (bundle, deps) {
  bundle.use('LoginScreen', 'RecordScreen', 'SaveScreen', 'MemoryUsage', 'Vumeter');
  bundle.defineView('RecorderApp', RecorderAppSelector, RecorderApp);
  bundle.defineView('RecorderGlobalControls', RecorderGlobalControlsSelector, RecorderGlobalControls);
};
