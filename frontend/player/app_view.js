
import React from 'react';

/*
      screen      main-view-no-subtitles
  sm   800…1024   794  (subtitles always hidden)
  md  1024…1200   940 if no subtitles, 794 if subtitles
  lg  1200…      1140 if no subtitles, 940 if no subtitles
*/

class PlayerApp extends React.PureComponent {
  render () {
    const {preventInput, geometry, PlayerControls, MainView, panes, showSubtitlesBand, SubtitlesBand} = this.props;
    return (
      <div style={{overflow: 'hidden'}}>
        <div style={{width: `${geometry.width}px`, float: 'left'}}>
          <MainView preventInput={preventInput} controls={<PlayerControls/>}/>
        </div>
        {panes.entrySeq().map(([key, pane]) => {
          if (!pane.get('visible')) return false;
          const View = pane.get('View');
          return (
            <div key={key} className='pane' style={{width: `${pane.get('width')}px`}}>
              <View />
            </div>);
          })}
        {showSubtitlesBand && <SubtitlesBand/>}
      </div>
    );
  }
}

export default function (bundle, deps) {

  bundle.use('PlayerControls', 'MainView', 'getPlayerState', 'SubtitlesBand');
  bundle.defineView('PlayerApp', PlayerAppSelector, PlayerApp);

  function PlayerAppSelector (state, props) {
    const {PlayerControls, MainView, SubtitlesBand} = deps;
    const geometry = state.get('mainViewGeometry');
    const panes = state.get('panes');
    const showSubtitlesPane = state.get('showSubtitlesPane');
    const showSubtitlesBand = state.get('showSubtitlesBand');
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const preventInput = !/ready|paused/.test(status);
    return {
      preventInput, geometry, PlayerControls, MainView, panes,
      showSubtitlesBand, SubtitlesBand
    };
  }

};
