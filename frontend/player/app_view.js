
import React from 'react';

class PlayerApp extends React.PureComponent {
  render () {
    const {preventInput, size, PlayerControls, MainView, SubtitlesPane, SubtitlesBand} = this.props;
    return (
      <div className={`container size-${size}`} style={{position: 'relative'}}>
        <div className="row">
          <div className="col-sm-12">
            <PlayerControls/>
          </div>
        </div>
        <MainView preventInput={preventInput}/>
        {size === 'lg' && <SubtitlesPane/>}
        <SubtitlesBand/>
      </div>
    );
  }
}

export default function (bundle, deps) {

  bundle.use('PlayerControls', 'MainView', 'getPlayerState', 'SubtitlesPane', 'SubtitlesBand');
  bundle.defineView('PlayerApp', PlayerAppSelector, PlayerApp);

  function PlayerAppSelector (state, props) {
    const {PlayerControls, MainView, SubtitlesPane, SubtitlesBand} = deps;
    const size = state.get('size');
    const player = deps.getPlayerState(state);
    const status = player.get('status');
    const preventInput = !/ready|paused/.test(status);
    return {preventInput, size, PlayerControls, MainView, SubtitlesPane, SubtitlesBand};
  }

};
