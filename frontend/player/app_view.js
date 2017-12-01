
import React from 'react';

/*
      screen      main-view-no-subtitles
  sm   800…1024   794  (subtitles always hidden)
  md  1024…1200   940 if no subtitles, 794 if subtitles
  lg  1200…      1140 if no subtitles, 940 if no subtitles
*/

class PlayerApp extends React.PureComponent {
  render () {
    const {preventInput, width, PlayerControls, MainView, showSubtitlesPane, SubtitlesPane, showSubtitlesBand, SubtitlesBand} = this.props;
    return (
      <div style={{position: 'relative', margin: '0 auto', width: `${width}px`}}>
        <MainView preventInput={preventInput} controls={<PlayerControls/>}/>
        {showSubtitlesPane && <SubtitlesPane/>}
        {showSubtitlesBand && <SubtitlesBand/>}
      </div>
    );
  }
}

export default function (bundle, deps) {

  bundle.use('PlayerControls', 'MainView', 'getPlayerState', 'SubtitlesPane', 'SubtitlesBand');
  bundle.defineView('PlayerApp', PlayerAppSelector, PlayerApp);

  function PlayerAppSelector (state, props) {
    const {PlayerControls, MainView, SubtitlesPane, SubtitlesBand} = deps;
    const geometry = state.get('mainViewGeometry');
    const showSubtitlesPane = state.get('showSubtitlesPane');
    const showSubtitlesBand = state.get('showSubtitlesBand');
    const width = geometry.width + (showSubtitlesPane ? 200 : 0);
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const preventInput = !/ready|paused/.test(status);
    return {
      preventInput, width, PlayerControls, MainView,
      showSubtitlesPane, SubtitlesPane,
      showSubtitlesBand, SubtitlesBand
    };
  }

};
