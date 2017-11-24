
import React from 'react';
import classnames from 'classnames';
import srtParse from 'subtitle/lib/parse';  //  {parse, stringify, resync, toMS, toSrtTime}
import clickDrag from 'react-clickdrag';

import {formatTime} from './utils';

class SubtitleItem extends React.PureComponent {
  render() {
    const {item: {text, start}, selected} = this.props;
    return (
      <p className={classnames(['subtitles-item', selected && 'subtitles-item-selected'])} onClick={this._onClick}>
        <span className='subtitles-timestamp'>{formatTime(start)}</span>
        <span className='subtitles-text'>{text}</span>
      </p>
    );
  }
  _onClick = () => {
    this.props.onClick(this.props.item);
  };
}

class SubtitlesPane extends React.PureComponent {
  render () {
    const {subtitles, currentIndex} = this.props;
    return (
      <div className='subtitles-container'>
        <div className='subtitles-pane'>
          {subtitles.map((st, index) => <SubtitleItem key={index} item={st} selected={currentIndex === index} onClick={this._onSubtitleClick}/>)}
        </div>
      </div>
    );
  }
  _onSubtitleClick = (subtitle) => {
    this.props.dispatch({type: this.props.playerSeek, audioTime: subtitle.start});
  };
}

class SubtitlesBand extends React.PureComponent {
  render () {
    const {active, item, offsetY, dataDrag: {isMoving}} = this.props;
    const translation = `translate(0px, ${this.state.currentY}px)`;
    return (
      <div className={classnames(['subtitles-band', `subtitles-band-${active?'':'in'}active`, isMoving && 'subtitles-band-moving', 'no-select'])}
        style={{transform: translation}}>
        {item && <p className='subtitles-text'>{item.text}</p>}
      </div>
    );
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.dataDrag.isMoving) {
      this.setState({
        currentY: this.state.lastPositionY + nextProps.dataDrag.moveDeltaY
      });
    } else {
      this.setState({
        lastPositionY: this.state.currentY
      });
    }
  }
  state = {currentY: 0, lastPositionY: 0};
}

function findSubtitleIndex (items, time) {
  let low = 0, high = items.length;
  while (low + 1 < high) {
    const mid = (low + high) / 2 | 0;
    const item = items[mid];
    if (item.start <= time) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

function updateCurrentItem (subtitles, audioTime) {
  const currentIndex = findSubtitleIndex(subtitles.items, audioTime);
  const currentItem = subtitles.items[currentIndex];
  const itemVisible = currentItem.start <= audioTime && audioTime <= currentItem.end;
  return {...subtitles, currentIndex, itemVisible};
}

function initReducer (state) {
  return state.set('subtitles', {items: subtitles, currentIndex: 0, offsetY: 10});
}

function playerSeekedReducer (state, action) {
  const {seekTo} = action;
  return state.update('subtitles', function (subtitles) {
    return updateCurrentItem(subtitles, seekTo);
  });
}

function playerTickReducer (state, action) {
  const {audioTime} = action;
  return state.update('subtitles', function (subtitles) {
    return updateCurrentItem(subtitles, audioTime);
  });
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

module.exports = function (bundle, deps) {

  bundle.use('getPlayerState', 'playerSeek');
  bundle.defineView('SubtitlesPane', SubtitlesPaneSelector, SubtitlesPane);
  bundle.defineView('SubtitlesBand', SubtitlesBandSelector,
    clickDrag(SubtitlesBand, {touch: true}));
  bundle.addReducer('init', initReducer);
  bundle.defineAction('subtitlesBandBeginMove', 'Subtitles.Band.BeginMove');
  bundle.addReducer('subtitlesBandBeginMove', subtitlesBandBeginMoveReducer);
  bundle.defineAction('subtitlesBandEndMove', 'Subtitles.Band.EndMove');
  bundle.addReducer('subtitlesBandEndMove', subtitlesBandEndMoveReducer);
  bundle.defineAction('subtitlesBandMoved', 'Subtitles.Band.Moved');
  bundle.addReducer('subtitlesBandMoved', subtitlesBandMovedReducer);
  bundle.addReducer('playerSeeked', playerSeekedReducer);
  bundle.addReducer('playerTick', playerTickReducer);

  function SubtitlesPaneSelector (state, props) {
    const {playerSeek} = deps;
    const {items, currentIndex} = state.get('subtitles');
    return {subtitles: items, currentIndex, playerSeek};
  }

  function SubtitlesBandSelector (state, props) {
    const {items, currentIndex, itemVisible, isMoving, offsetY} = state.get('subtitles');
    return {
        active: itemVisible, item: items[currentIndex], isMoving, offsetY,
        beginMove: deps.subtitlesBandBeginMove,
        endMove: deps.subtitlesBandEndMove,
        doMove: deps.subtitlesBandMoved,
    };
  }

};

const subtitles = srtParse(["1",
  "00:00:02,000 --> 00:00:03,999",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "",
  "2",
  "00:00:05,000 --> 00:00:06,999",
  "Duis maximus nulla sed aliquet lobortis.",
  "",
  "3",
  "00:00:10,000 --> 00:00:11,999",
  "Donec aliquet lectus a turpis euismod pharetra.",
  "",
  "4",
  "00:00:15,000 --> 00:00:16,999",
  "Cras tincidunt libero nec enim molestie, at rutrum quam interdum.",
  "",
  "5",
  "00:00:20,000 --> 00:00:21,999",
  "Nulla elementum libero at nunc congue, non blandit dui pellentesque.",
  "",
  "6",
  "00:00:25,000 --> 00:00:26,999",
  "Phasellus bibendum enim vel lectus euismod, eu commodo mauris malesuada.",
  "",
  "7",
  "00:00:30,000 --> 00:00:31,999",
  "Donec accumsan lacus ac purus elementum, a blandit felis commodo.",
  "",
  "8",
  "00:00:35,000 --> 00:00:36,999",
  "Vivamus hendrerit erat nec dictum posuere.",
  "",
  "9",
  "00:00:40,000 --> 00:00:41,999",
  "Cras elementum libero et viverra porta.",
  "",
  "10",
  "00:00:45,000 --> 00:00:46,999",
  "Sed rhoncus nunc nec lacus rutrum, in sollicitudin tellus vehicula.",
  "",
  "11",
  "00:00:50,000 --> 00:00:51,999",
  "Morbi fermentum sem sit amet est blandit pellentesque laoreet in augue.",
  "",
  "12",
  "00:00:55,000 --> 00:00:56,999",
  "Aenean at velit posuere, gravida augue eu, porttitor justo.",
  "",
  "13",
  "00:01:00,000 --> 00:01:01,999",
  "Morbi quis orci tristique, tristique sem quis, vulputate tortor.",
  "",
  "14",
  "00:01:05,000 --> 00:01:06,999",
  "Fusce ornare sapien et leo dictum, quis pharetra magna facilisis.",
  "",
  "15",
  "00:01:10,000 --> 00:01:11,999",
  "Phasellus gravida odio pellentesque ipsum sodales sagittis.",
  "",
  "16",
  "00:01:15,000 --> 00:01:16,999",
  "Aenean ultrices dui at mauris ornare efficitur.",
  "",
  "17",
  "00:01:20,000 --> 00:01:21,999",
  "Phasellus egestas nulla eget dolor faucibus ultricies sed tristique nibh.",
  "",
  "18",
  "00:01:25,000 --> 00:01:26,999",
  "Maecenas suscipit lorem tincidunt magna pulvinar posuere.",
  "",
  "19",
  "00:01:30,000 --> 00:01:31,999",
  "Etiam egestas erat vitae velit consequat, bibendum tristique dolor pellentesque.",
  "",
  "20",
  "00:01:35,000 --> 00:01:36,999",
  "Nulla tincidunt ex a metus lacinia, at fringilla leo auctor.",
  "",
  "21",
  "00:01:40,000 --> 00:01:41,999",
  "Nunc eu leo nec magna finibus scelerisque.",
  "",
  "22",
  "00:01:45,000 --> 00:01:46,999",
  "Cras aliquet ligula eu nunc tincidunt, ac pellentesque ipsum ultricies.",
  "",
  "23",
  "00:01:50,000 --> 00:01:51,999",
  "Nulla sit amet leo efficitur, hendrerit mauris ac, iaculis velit.",
  "",
  "24",
  "00:01:55,000 --> 00:01:56,999",
  "Nam pretium orci non tortor blandit, et laoreet ex rutrum.",
  "",
  "25",
  "00:02:00,000 --> 00:02:01,999",
  "Vivamus suscipit leo sit amet accumsan malesuada.",
  "",
  "26",
  "00:02:05,000 --> 00:02:06,999",
  "Duis ornare sapien id risus luctus, quis fringilla orci auctor.",
  "",
  "27",
  "00:02:10,000 --> 00:02:11,999",
  "Aenean quis mauris placerat, sollicitudin turpis ut, rhoncus lorem.",
  "",
  "28",
  "00:02:15,000 --> 00:02:16,999",
  "In sit amet mauris quis sem tristique suscipit.",
  "",
  "29",
  "00:02:20,000 --> 00:02:21,999",
  "Mauris vitae mi ac nisl semper tristique at eget nisl.",
  "",
  "30",
  "00:02:25,000 --> 00:02:26,999",
  "In id turpis vulputate, efficitur libero non, vestibulum lectus.",
  "",
  "31",
  "00:02:30,000 --> 00:02:31,999",
  "Donec ut lorem blandit, consequat tortor sit amet, tempor metus.",
  "",
  "32",
  "00:02:35,000 --> 00:02:36,999",
  "Pellentesque pulvinar nunc non tortor fermentum egestas.",
  "",
  "33",
  "00:02:40,000 --> 00:02:41,999",
  "Mauris at ipsum elementum, imperdiet lectus sit amet, hendrerit orci.",
  "",
  "34",
  "00:02:45,000 --> 00:02:46,999",
  "Quisque id dui vehicula, aliquam ante sed, dictum metus.",
  "",
  "35",
  "00:02:50,000 --> 00:02:51,999",
  "Pellentesque at massa quis tellus venenatis feugiat eu id metus.",
  "",
  "36",
  "00:02:55,000 --> 00:02:56,999",
  "Praesent in orci et sapien vehicula laoreet vitae vitae quam.",
  "",
  "37",
  "00:03:00,000 --> 00:03:01,999",
  "Ut a mi feugiat, semper metus sed, malesuada quam.",
  "",
  "38",
  "00:03:05,000 --> 00:03:06,999",
  "Pellentesque sagittis enim fermentum condimentum sodales.",
  "",
  "39",
  "00:03:10,000 --> 00:03:11,999",
  "Fusce in tellus et magna facilisis luctus.",
  "",
  "40",
  "00:03:15,000 --> 00:03:16,999",
  "Fusce cursus lacus non ex venenatis, volutpat molestie dui aliquet.",
  "",
  "41",
  "00:03:20,000 --> 00:03:21,999",
  "In in nisi sit amet ex bibendum dictum id in nunc.",
  "",
  "42",
  "00:03:25,000 --> 00:03:26,999",
  "Donec a diam at tortor consequat volutpat.",
  "",
  "43",
  "00:03:30,000 --> 00:03:31,999",
  "Cras fringilla elit at mauris mattis, sed dapibus risus egestas.",
  "",
  "44",
  "00:03:35,000 --> 00:03:36,999",
  "Praesent sed velit laoreet dolor eleifend sodales facilisis quis neque.",
  "",
  "45",
  "00:03:40,000 --> 00:03:41,999",
  "Curabitur a est sit amet nibh lobortis mollis vel sed sapien.",
  "",
  "46",
  "00:03:45,000 --> 00:03:46,999",
  "Etiam nec massa efficitur, viverra diam at, sollicitudin est.",
  "",
  "47",
  "00:03:50,000 --> 00:03:51,999",
  "Maecenas finibus lacus at velit maximus, in pellentesque velit consequat.",
  "",
  "48",
  "00:03:55,000 --> 00:03:56,999",
  "Aenean vulputate turpis quis lobortis consequat.",
  "",
  "49",
  "00:04:00,000 --> 00:04:01,999",
  "Suspendisse eget erat mollis lacus dapibus gravida vitae sit amet arcu.",
  "",
  "50",
  "00:04:05,000 --> 00:04:06,999",
  "Maecenas gravida arcu vel dapibus dignissim.",
  "",
  "51",
  "00:04:10,000 --> 00:04:11,999",
  "Duis non nisl mattis, eleifend velit et, ultrices purus.",
  "",
  "52",
  "00:04:15,000 --> 00:04:16,999",
  "Donec auctor erat nec rhoncus vehicula.",
  "",
  "53",
  "00:04:20,000 --> 00:04:21,999",
  "Vestibulum in odio et velit vehicula consequat eget vel magna.",
  "",
  "54",
  "00:04:25,000 --> 00:04:26,999",
  "Nunc consequat orci nec quam porta scelerisque sed sed ligula.",
  "",
  "55",
  "00:04:30,000 --> 00:04:31,999",
  "Nunc pellentesque quam et diam iaculis, vitae tincidunt tellus semper.",
  "",
  "56",
  "00:04:35,000 --> 00:04:36,999",
  "Sed maximus orci vel dolor molestie maximus.",
  "",
  "57",
  "00:04:40,000 --> 00:04:41,999",
  "Donec cursus felis at dolor scelerisque, nec accumsan sapien efficitur.",
  "",
  "58",
  "00:04:45,000 --> 00:04:46,999",
  "Morbi auctor risus at pellentesque aliquet.",
  "",
  "59",
  "00:04:50,000 --> 00:04:51,999",
  "Vivamus congue nulla vel justo luctus volutpat.",
  "",
  "60",
  "00:04:55,000 --> 00:04:56,999",
  "Praesent viverra nisi ac tristique sodales."].join("\r\n"));

