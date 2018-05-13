
import React from 'react';
import classnames from 'classnames';

/*
      screen      main-view-no-subtitles
  xs      …800    best effort
  sm   800…1024   794  (subtitles always hidden)
  md  1024…1200   940 if no subtitles, 794 if subtitles
  lg  1200…      1140 if no subtitles, 940 if subtitles
*/

class PlayerApp extends React.PureComponent {
  render () {
    const {containerWidth, viewportTooSmall, PlayerControls, MainView, MainViewPanes, SubtitlesBand} = this.props;
    return (
      <div>
        <div id='main' style={{width: `${containerWidth}px`}} className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
          <PlayerControls/>
          <div id='mainView-container'>
            <MainView/>
            <MainViewPanes/>
          </div>
          {SubtitlesBand && <SubtitlesBand/>}
        </div>
      </div>
    );
  }
}

function PlayerAppSelector (state, props) {
  const {PlayerControls, MainView, MainViewPanes, getSubtitlesBandVisible, SubtitlesBand} = state.get('scope');
  const viewportTooSmall = state.get('viewportTooSmall');
  const containerWidth = state.get('containerWidth');
  return {
    viewportTooSmall, containerWidth,
    PlayerControls, MainView, MainViewPanes,
    SubtitlesBand: getSubtitlesBandVisible(state) && SubtitlesBand,
  };
}

export default function (bundle) {
  bundle.defineView('PlayerApp', PlayerAppSelector, PlayerApp);
};
