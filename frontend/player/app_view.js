
import React from 'react';
import classnames from 'classnames';
import {Alert, Intent, ProgressBar} from '@blueprintjs/core';

/*
      screen      main-view-no-subtitles
  xs      …800    best effort
  sm   800…1024   794  (subtitles always hidden)
  md  1024…1200   940 if no subtitles, 794 if subtitles
  lg  1200…      1140 if no subtitles, 940 if subtitles
*/

class PlayerApp extends React.PureComponent {
  render () {
    const {containerWidth, viewportTooSmall, PlayerControls, StepperView, SubtitlesBand, isReady, progress, error} = this.props;
    return (
      <div id='player-app'>
        {!isReady &&
          <div id='main' style={{width: `${containerWidth}px`, margin: '20px auto'}}>
            <ProgressBar value={progress} intent={Intent.SUCCESS}/>
          </div>}
        {isReady &&
          <div id='main' style={{width: `${containerWidth}px`}} className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
            <PlayerControls/>
            <StepperView/>
            <SubtitlesBand/>
          </div>}
        {error &&
          <Alert intent={Intent.DANGER} icon='error' isOpen={!!error} onConfirm={this.reload}>
            <p style={{fontSize: '150%', fontWeight: 'bold'}}>{"A fatal error has occured while preparing playback."}</p>
            <p>{"Source: "}{error.source}</p>
            <p>{"Error: "}{error.message}</p>
            <p>{"Details: "}{error.details}</p>
            <p style={{fontWeight: 'bold'}}>{"Click OK to reload the page."}</p>
          </Alert>}
      </div>
    );
  }
  reload = () => {
    window.location.reload();
  };
}

function PlayerAppSelector (state, props) {
  const {PlayerControls, StepperView, SubtitlesBand} = state.get('scope');
  const viewportTooSmall = state.get('viewportTooSmall');
  const containerWidth = state.get('containerWidth');
  const player = state.get('player');
  const isReady = player.get('isReady');
  const progress = player.get('progress');
  const error = player.get('error');
  return {
    viewportTooSmall, containerWidth,
    PlayerControls, StepperView, SubtitlesBand,
    isReady, progress, error
  };
}

export default function (bundle) {
  bundle.defineView('PlayerApp', PlayerAppSelector, PlayerApp);
};
