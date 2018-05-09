
import React from 'react';

export class FullWaveform extends React.PureComponent {
  render () {
    return <canvas height='100' width={this.props.width} ref={this.refCanvas}
      onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove} />;
  }
  componentDidMount () {
    this.updateCanvas();
  }
  componentDidUpdate () {
    this.updateCanvas();
  }
  state = {mode: 'idle'};
  updateCanvas = () => {
    const {duration, waveform, events} = this.props;
    const imageWidth = this.canvas.width;
    const leftMargin = 3;
    const width = imageWidth - leftMargin * 2;
    const height = this.canvas.height;
    const firstTimestamp = 0;
    const lastTimestamp = duration;
    const scale = width / (lastTimestamp - firstTimestamp);
    const params = this._params = {duration, width, height, leftMargin, firstTimestamp, lastTimestamp, scale};
    const ctx = this.canvas.getContext('2d');
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (width !== this._width) {
      this._miniWaveform = downsampleWaveform(waveform, width);
      this._width = width;
    }
    renderWaveform(ctx, this._params, this._miniWaveform);
    ctx.globalAlpha = 0.3;
    for (let range of this.props.ranges) {
      renderRange(ctx, this._params, range);
    }
    ctx.globalAlpha = 1;
    renderEvents(ctx, this._params, this.props.events);
    ctx.globalAlpha = 0.5;
    renderMarker(ctx, this._params, {position: this.props.position, color: '#000'});
  };
  refCanvas = (canvas) => {
    this.canvas = canvas;
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
    const rect = this.canvas.getBoundingClientRect();
    this.props.onPan(canvasToTimestamp(this._params, x - rect.left));
  };
}

export class ExpandedWaveform extends React.PureComponent {
  render () {
    return <canvas height='100' width={this.props.width} ref={this.refCanvas}
      onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove} />;
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
    const {width, height} = this.canvas;
    const {position, duration, waveform, events} = this.props;
    const leftMargin = 0;
    const scale = 60 / 1000; /* Fixed scale: 60 pixels per 1000ms */
    const centerSample = Math.round(position * 60 / 1000);
    const maxSample = Math.floor(duration * 60 / 1000) - width;
    const firstSample = Math.min(maxSample, Math.max(0, centerSample - width / 2));
    const firstTimestamp = firstSample / scale;
    const lastTimestamp = (firstTimestamp + width) / scale;
    const params = this._params = {duration, width, height, leftMargin, firstTimestamp, lastTimestamp, scale};
    const ctx = this.canvas.getContext('2d');
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, width, height);
    renderWaveform(ctx, params, waveform);
    ctx.globalAlpha = 1;
    renderEvents(ctx, params, events);
    ctx.globalAlpha = 0.5;
    renderMarker(ctx, params, {position, color: '#000'});
  };
}

export function extractWaveform (buffer, tgt_length) {
  const src_length = buffer.length;
  let src_start = 0;
  let ip = Math.floor(src_length / tgt_length);
  let fp = src_length % tgt_length;
  let error = 0;
  let tgt_pos = 0;
  const tgt = new Float32Array(tgt_length);
  while (src_start < src_length) {
    let src_end = src_start + ip;
    error += fp;
    if (error >= tgt_length) {
      error -= tgt_length;
      src_end += 1;
    }
    let value = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let pos = src_start; pos < src_end; pos += 1) {
        value += Math.abs(data[pos]);
      }
    }
    value = value / (src_end - src_start) / buffer.numberOfChannels;
    tgt[tgt_pos] = value;
    tgt_pos += 1;
    src_start = src_end;
  }
  const factor = 0.1 * tgt_length / tgt.reduce((a, x) => a + x, 0);
  if (factor > 0) {
    for (tgt_pos = 0; tgt_pos < tgt_length; tgt_pos += 1) {
      tgt[tgt_pos] *= factor;
    }
  }
  return tgt;
}

function downsampleWaveform (waveform, tgt_length) {
  const src_length = waveform.length;
  let src_start = 0;
  let ip = Math.floor(src_length / tgt_length);
  let fp = src_length % tgt_length;
  let error = 0;
  let tgt_pos = 0;
  const tgt = new Float32Array(tgt_length);
  while (src_start < src_length) {
    let src_end = src_start + ip;
    error += fp;
    if (error >= tgt_length) {
      error -= tgt_length;
      src_end += 1;
    }
    let minValue = 1, maxValue = 0;
    for (let pos = src_start; pos < src_end; pos += 1) {
      minValue = Math.min(minValue, waveform[pos]);
      maxValue = Math.max(maxValue, waveform[pos]);
    }
    tgt[tgt_pos] = (minValue + maxValue) / 2;
    tgt_pos += 1;
    src_start = src_end;
  }
  return tgt;
}

function renderWaveform (ctx, params, samples) {
  /* Assumes samples is computed such that 1 sample corresponds to 1 canvas pixel. */
  const {duration, width, height, leftMargin, firstTimestamp, lastTimestamp} = params;
  const timescale = samples.length / duration;
  const firstIndex = Math.round(canvasToTimestamp(params, leftMargin) * timescale);
  const midY = height / 2;
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 1) {
    const y = samples[firstIndex + x] * height;
    ctx.beginPath();
    ctx.moveTo(leftMargin + x + 0.5, midY - y);
    ctx.lineTo(leftMargin + x + 0.5, midY + y + 1);
    ctx.stroke();
  }
}

function findEventIndex (events, timestamp, bias) {
  let low = 0, high = events.length;
  while (low + 1 < high) {
    const mid = (low + high) / 2 | 0;
    const event = events[mid];
    if (event[0] <= timestamp) {
      low = mid;
    } else {
      high = mid;
    }
  }
  if (bias === -1) {
    while (low > 0) {
      if (events[low - 1][0] !== events[low][0])
        break;
      low -= 1;
    }
  } else if (bias === 1) {
    while (low + 1 < events.length) {
      if (events[low + 1][0] !== events[low][0])
        break;
      low += 1;
    }
  }
  return low;
}

function renderEvents (ctx, params, events) {
  const {height, firstTimestamp, lastTimestamp} = params;
  const firstIndex = findEventIndex(events, firstTimestamp, -1);
  const lastIndex = findEventIndex(events, lastTimestamp, 1);
  const lineHeight = 5;
  const y0 = (height - lineHeight) / 2;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const event = events[index];
    const x = timestampToCanvas(params, event[0]);
    let line = 0;
    const t = event[1];
    if (/^(start|end|translate)/.test(t)) {
      line = -1;
      ctx.strokeStyle = '#f55656'; // @red4
    } else if (/^buffer\.(insert|delete)/.test(t)) {
      line = 1;
      ctx.strokeStyle = '#2b95d6'; // @blue4
    } else if (/^terminal|ioPane|arduino/.test(t)) {
      line = 1;
      ctx.strokeStyle = '#f29d49'; // @orange4
    } else if (/^stepper/.test(t)) {
      line = 2;
      ctx.strokeStyle = '#15b371'; // @green4
    } else {
      ctx.strokeStyle = '#5c7080'; // @gray1
    }
    ctx.beginPath();
    ctx.moveTo(x - 1, y0 + line * lineHeight);
    ctx.lineTo(x + 2, y0 + line * lineHeight);
    ctx.stroke();
  }
}

function renderRange (ctx, params, range) {
  const {scale, width, height, leftMargin, firstSample} = params;
  const x1 = timestampToCanvas(params, range.start);
  const x2 = timestampToCanvas(params, range.end);
  if (x2 >= 0 && x1 <= width) {
    ctx.fillStyle = range.color;
    ctx.fillRect(x1 + 0.5, 0, x2 - x1 + 1, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x1 + 0.5, 0, x2 - x1 + 1, height);
  }
}

function renderMarker (ctx, params, {position, color}) {
  const {width, height, leftMargin, firstSample} = params;
  const x = timestampToCanvas(params, position);
  if (x >= 0 && x < width) {
    ctx.lineWidth = 2;
    ctx.lineCap = 'square';
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

function timestampToCanvas (params, timestamp) {
  return params.leftMargin + (timestamp - params.firstTimestamp) * params.scale;
}

function canvasToTimestamp (params, x) {
  return params.firstTimestamp + x / params.scale - params.leftMargin;
}
