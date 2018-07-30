
import React from 'react';

import {renderCursor, renderRange, renderEvents, renderMarker, canvasToTimestamp, downsampleWaveform, renderMiniWaveform} from './tools';

export default class FullWaveform extends React.PureComponent {
  render () {
    const {onPan, width, height} = this.props;
    return <canvas width={width} height={height} ref={this.refCanvas}
      onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove}
      style={{cursor: onPan ? 'pointer' : 'default'}} />;
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
  updateCanvas = () => {
    this._params = render(this.props, this.canvas, this._params);
  };
  mouseDown = (event) => {
    this.setState({mode: 'panning'});
    this.panned(event.clientX);
  };
  mouseUp = (event) => {
    this.setState({mode: 'idle'});
  };
  mouseMove = (event) => {
    if (this.state.mode === 'idle') return;
    if (event.buttons === 0) { this.setState({mode: 'idle'}); return; }
    this.panned(event.clientX);
  };
  panned = (x) => {
    const {onPan} = this.props;
    if (onPan) {
      const rect = this.canvas.getBoundingClientRect();
      onPan(canvasToTimestamp(this._params, x - rect.left));
    }
  };
}

function render (props, canvas, prevParams) {
  const {duration, position, waveform, events, viewStart, viewEnd, intervals} = props;
  const {width, height} = canvas;
  const leftMargin = 3;
  const useableWidth = width - leftMargin * 2;
  const firstTimestamp = 0;
  const lastTimestamp = duration;
  const scale = useableWidth / (lastTimestamp - firstTimestamp);
  const params = {duration, width, height, leftMargin, firstTimestamp, lastTimestamp, scale};
  const ctx = canvas.getContext('2d');
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 0, width, height);
  if (intervals) {
    for (let {start, end, value: {skip, mute}} of intervals) {
      if (end === +Infinity) end = duration;
      renderRange(ctx, params, {start, end, color: skip ? '#808080' : '#f8f8f8'}); // XXX
    }
  }
  if (prevParams && width === prevParams.width) {
    params.miniWaveform = prevParams.miniWaveform;
  } else {
    params.miniWaveform = downsampleWaveform(waveform, useableWidth);
  }
  renderMiniWaveform(ctx, params, params.miniWaveform, intervals);
  if (typeof viewStart === 'number' && typeof viewEnd === 'number') {
    ctx.globalAlpha = 0.3;
    renderRange(ctx, params, {start: viewStart, end: viewEnd, color: '#888'});
  }
  if (events) {
    ctx.globalAlpha = 1;
    renderEvents(ctx, params, events);
  }
  if (intervals) {
    for (let p of intervals.keys) {
      renderMarker(ctx, params, {position: p, color: '#ff0000'});
    }
  }
  if (typeof position === 'number') {
    renderCursor(ctx, params, {position, alpha: 0.7});
  }
  return params;
}
