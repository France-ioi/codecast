
import React from 'react';
import classnames from 'classnames';
import {Alert, Intent} from '@blueprintjs/core';

/*
      screen      main-view-no-subtitles
  xs      …800    best effort
  sm   800…1024   794  (subtitles always hidden)
  md  1024…1200   940 if no subtitles, 794 if subtitles
  lg  1200…      1140 if no subtitles, 940 if subtitles
*/

class PlayerApp extends React.PureComponent {
  render () {
    const {containerWidth, viewportTooSmall, PlayerControls, MainView, MainViewPanes, SubtitlesBand, error} = this.props;
    return (
      <div id='player-app'>
        <div id='main' style={{width: `${containerWidth}px`}} className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
          <PlayerControls/>
          <div id='mainView-container'>
            <MainView/>
            <MainViewPanes/>
          </div>
          {/*<SubtitlesBand/>*/}
        </div>
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
  const {PlayerControls, MainView, MainViewPanes, SubtitlesBand} = state.get('scope');
  const viewportTooSmall = state.get('viewportTooSmall');
  const containerWidth = state.get('containerWidth');
  const error = state.getIn(['player', 'error']);
  return {
    viewportTooSmall, containerWidth,
    PlayerControls, MainView, MainViewPanes, SubtitlesBand,
    error
  };
}

export default function (bundle) {
  bundle.defineView('PlayerApp', PlayerAppSelector, PlayerApp);
};
