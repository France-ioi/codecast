
import React from 'react';

import {renderEvents, renderRange, renderMarker, renderCursor, renderWaveform, renderTicks} from './tools';

export default class ExpandedWaveform extends React.PureComponent {
  render () {
    return <canvas height={this.props.height} width={this.props.width} ref={this.refCanvas}
      onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove}
      style={{cursor: 'move'}} />;
  }
  componentDidMount () {
    this.updateCanvas();
  }
  componentDidUpdate () {
    this.updateCanvas();
  }
  state = {mode: 'idle'};
  refCanvas = (canvas) => {
    this.canvas = canvas;
  };
  mouseDown = (event) => {
    const rect = this.canvas.getBoundingClientRect();
    const refX = event.clientX - rect.left;
    const refT = this.props.position;
    this.setState({mode: 'panning', refX, refT});
  };
  mouseUp = (event) => {
    this.setState({mode: 'idle'});
  };
  mouseMove = (event) => {
    if (this.state.mode === 'idle') return;
    if (event.buttons === 0) { this.setState({mode: 'idle'}); return; }
    const rect = this.canvas.getBoundingClientRect();
    const newX = event.clientX - rect.left;
    const deltaT = (newX - this.state.refX) / this._params.scale;
    this.props.onPan(this.state.refT - deltaT);
  };
  updateCanvas = () => {
    this._params = render(this.props, this.canvas, this._params);
  };
}

function render (props, canvas, prevParams) {
  const {position, duration, waveform, events, intervals} = props;
  const {width, height} = canvas;
  const scale = 60 / 1000; /* Fixed scale: 60 pixels per 1000ms */
  let firstSample, leftMargin = 0;
  if (true) {
    const currentSample = Math.round(position * 60 / 1000);
    const maxSample = Math.floor(duration * 60 / 1000);
    firstSample = Math.min(maxSample, Math.max(- width / 2, Math.round(currentSample - width / 2)));
  } else {
    const centerSample = Math.round(position * 60 / 1000);
    const maxSample = Math.floor(duration * 60 / 1000) - width;
    firstSample = Math.min(maxSample, Math.max(0, centerSample - width / 2));
  }
  const firstTimestamp = firstSample / scale;
  const lastTimestamp = (firstTimestamp + width) / scale;
  const params = {duration, width, height, leftMargin, firstTimestamp, lastTimestamp, scale};
  const ctx = canvas.getContext('2d');
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, width, height);
  if (intervals) {
    for (let {start, end, value: {skip, mute}} of intervals) {
      if (end === +Infinity) end = duration;
      renderRange(ctx, params, {start, end, color: skip ? '#808080' : '#f8f8f8'}); // XXX muted
    }
  }
  renderTicks(ctx, params);
  renderWaveform(ctx, params, waveform, intervals);
  ctx.globalAlpha = 1;
  renderEvents(ctx, params, events);
  for (let p of intervals.keys) {
    renderMarker(ctx, params, {position: p, color: '#ff0000'});
  }
  renderCursor(ctx, params, {position, alpha: 0.9});
  return params;
}
