
import React from 'react';
import classnames from 'classnames';
import clickDrag from 'react-clickdrag';
import update from 'immutability-helper';

export default function (bundle) {

  bundle.defineAction('subtitlesBandBeginMove', 'Subtitles.Band.BeginMove');
  bundle.defineAction('subtitlesBandEndMove', 'Subtitles.Band.EndMove');
  bundle.defineAction('subtitlesBandMoved', 'Subtitles.Band.Moved');

  bundle.addReducer('subtitlesBandBeginMove', subtitlesBandBeginMoveReducer);
  bundle.addReducer('subtitlesBandEndMove', subtitlesBandEndMoveReducer);
  bundle.addReducer('subtitlesBandMoved', subtitlesBandMovedReducer);

  bundle.defineView('SubtitlesBand', SubtitlesBandSelector,
    clickDrag(SubtitlesBand, {touch: true}));

}

function subtitlesBandBeginMoveReducer (state, {payload: {y}}) {
  return state.update('subtitles', function (subtitles) {
    return {...subtitles, isMoving: true, startY: y};
  });
}

function subtitlesBandEndMoveReducer (state, _action) {
  return state.update('subtitles', function (subtitles) {
    return {...subtitles, isMoving: false};
  });
}

function subtitlesBandMovedReducer (state, {payload: {y}}) {
  return state.update('subtitles', function (subtitles) {
    return {...subtitles, offsetY: 10 - (y - subtitles.startY)};
  });
}

function SubtitlesBandSelector (state, props) {
  const {loaded, editing, bandEnabled} = state.get('subtitles');
  if (!loaded || (!editing && !bandEnabled)) {
    return {hidden: true};
  }
  const geometry = state.get('mainViewGeometry');
  const {items, currentIndex, itemVisible, isMoving, offsetY} = state.get('subtitles');
  const windowHeight = state.get('windowHeight');
  const scope = state.get('scope');
  return {
    top: windowHeight - 60,
    active: itemVisible, item: items && items[currentIndex], isMoving, offsetY, geometry, windowHeight,
    beginMove: scope.subtitlesBandBeginMove,
    endMove: scope.subtitlesBandEndMove,
    doMove: scope.subtitlesBandMoved,
  };
}

class SubtitlesBand extends React.PureComponent {
  render () {
    const {hidden} = this.props;
    if (hidden) {
      /* ClickDrag requires a DOM node to attach to, so return a hidden element
         rather than false. */
      return <div style={{display: 'none'}}/>;
    }
    const {active, item, geometry, offsetY, dataDrag: {isMoving}, top} = this.props;
    const translation = `translate(0px, ${this.state.currentY}px)`;
    return (
      <div className={classnames(['subtitles-band', `subtitles-band-${active?'':'in'}active`, isMoving && 'subtitles-band-moving', 'no-select', `mainView-${geometry.size}`])}
        style={{top: `${top}px`, transform: translation, width: `${geometry.width}px`}} ref={this._refBand} >
        <div className='subtitles-band-frame'>
          {item && <p className='subtitles-text'>{item.text}</p>}
        </div>
      </div>
    );
  }
  static getDerivedStateFromProps (nextProps, prevState) {
    if (!nextProps.windowHeight) return null;
    const height = (prevState.band ? prevState.band.offsetHeight : 40);
    if (nextProps.dataDrag.isMoving) {
      const newPositionY = prevState.lastPositionY + nextProps.dataDrag.moveDeltaY;
      const currentY = Math.min(nextProps.windowHeight - nextProps.top - height, Math.max(-nextProps.top, newPositionY));
      return {currentY};
    } else {
      const currentY = Math.min(nextProps.windowHeight - nextProps.top - height, Math.max(-nextProps.top, prevState.currentY));
      return {currentY, lastPositionY: currentY};
    }
  }
  state = {band: null, currentY: 0, lastPositionY: 0};
  _refBand = (element) => {
    this.setState({band: element});
  };
}
