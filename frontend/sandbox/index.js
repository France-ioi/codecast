
import React from 'react';
import classnames from 'classnames';

export default function (bundle, deps) {
  bundle.defineView('SandboxApp', SandboxAppSelector, SandboxApp);
};

class SandboxApp extends React.PureComponent {
  render () {
    const {FullscreenButton, StepperControls, Menu, MainView, MainViewPanes, containerWidth, viewportTooSmall} = this.props;
    return (
      <div id='main' style={{width: `${containerWidth}px`}} className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
        <div id='player-controls'>
          <div className='player-controls-row row' style={{width: '100%'}}>
            <div className="player-controls controls controls-main col-sm-3"></div>
            <div className="player-controls player-controls-stepper col-sm-7">
              <StepperControls enabled={true}/>
            </div>
            <div className="player-controls player-controls-right col-sm-2">
              <Menu/>
              <FullscreenButton/>
            </div>
          </div>
        </div>
        <div id='mainView-container'>
          <MainView/>
          <MainViewPanes/>
        </div>
      </div>
    );
  };
}

function SandboxAppSelector (state) {
  const {FullscreenButton, StepperControls, Menu, MainView, MainViewPanes} = state.get('scope');
  const containerWidth = state.get('containerWidth');
  const viewportTooSmall = state.get('viewportTooSmall');
  return {
    viewportTooSmall, containerWidth,
    FullscreenButton, StepperControls, Menu, MainView, MainViewPanes
  };
}
