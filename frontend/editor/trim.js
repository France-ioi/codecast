
import React from 'react';
import {Button} from '@blueprintjs/core';

import FullWaveform from './waveform/full';
import ExpandedWaveform from './waveform/expanded';
import intervalTree from './interval_tree';

export default function (bundle, deps) {

  bundle.defineView('TrimEditor', TrimEditorSelector, TrimEditor);

};

function TrimEditorSelector (state, props) {
  const editor = state.get('editor');
  const duration = editor.get('duration');
  const waveform = editor.get('waveform');
  const {events} = editor.get('data');
  const waveformWidth = 800; // XXX
  return {duration, waveform, events, waveformWidth};
}

class TrimEditor extends React.PureComponent {
  render () {
    const {duration, waveform, events, waveformWidth} = this.props;
    const {position, viewStart, viewEnd, intervals} = this.state;
    return (
      <div>
        <FullWaveform height={60} width={waveformWidth} position={position} duration={duration}
          waveform={waveform} events={events} viewStart={viewStart} viewEnd={viewEnd}
          intervals={intervals} onPan={this.panTo} />
        <ExpandedWaveform height={100} width={waveformWidth} position={position} duration={duration}
          waveform={waveform} events={events} intervals={intervals} onPan={this.panTo} />
        <div>
          <Button onClick={this.addMarker} text="Add Marker"/>
          <Button onClick={this.removeMarker} text="Remove Marker"/>
          <Button onClick={this.toggle} text="Toggle"/>
        </div>
      </div>
    );
  }
  state = {position: 0, viewStart: 0, viewEnd: 0, intervals: intervalTree(true)};
  static getDerivedStateFromProps (nextProps, prevState) {
    return updateViewWindow(nextProps, prevState.position);
  }
  panTo = (position) => {
    position = Math.max(0, Math.min(this.props.duration, position));
    this.setState(updateViewWindow(this.props, position));
  };
  addMarker = () => {
    const {intervals, position} = this.state;
    this.setState({intervals: intervals.split(position)});
  };
  removeMarker = () => {
    const {intervals, position} = this.state;
    const {start} = intervals.get(position);
    this.setState({intervals: intervals.mergeLeft(start)});
  };
  toggle = () => {
    const {intervals, position} = this.state;
    const {value} = intervals.get(position);
    this.setState({intervals: intervals.set(position, !value)});
  };
}

function updateViewWindow (props, position) {
  if (!props.duration) return null;
  const {duration} = props;
  const visibleDuration = props.waveformWidth/*px*/ * 1000 / 60;
  position = Math.max(0, Math.min(duration, position));
  let viewStart = position - visibleDuration / 2;
  let viewEnd = position + visibleDuration / 2;
  if (viewStart < 0) {
    viewStart = 0;
  } else if (viewEnd > duration) {
    viewStart = Math.max(0, duration - visibleDuration);
  }
  viewEnd = viewStart + visibleDuration;
  return {position, viewStart, viewEnd};
}
