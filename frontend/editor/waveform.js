
import React from 'react';

export class FullWaveform extends React.PureComponent {
  render () {
    /*
      - Add props for
        - current position: number
        - begin/end of narrow view: {start: number, end: number}
        - begin/end of disabled ranges: [{start: number, end: number}]
          - or include in events?
      - Click/drag calls prop handle with time in ms
    */
    return <canvas height='100' width={this.props.width} ref={this.refCanvas}
      onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove} />;
  }
  componentDidMount () {
    const {duration, waveform, events} = this.props;
    const hMargin = 3;
    const imageWidth = this.canvas.width;
    const width = imageWidth - hMargin * 2;
    const height = this.canvas.height;
    const scale = width / (duration * 1000);
    this._miniWaveform = downsampleWaveform(waveform, width);
    this._params = {width, height, scale, x0: hMargin};
    this.updateCanvas();
  }
  componentDidUpdate () {
    this.updateCanvas();
  }
  state = {mode: 'idle'};
  updateCanvas = () => {
    const ctx = this.canvas.getContext('2d');
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
    const {x0, scale} = this._params;
    this.props.onPan((x - x0 - rect.left) / scale);
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
  const scale = 0.5 * tgt_length / tgt.reduce((a, x) => a + x, 0);
  if (scale > 0) {
    for (tgt_pos = 0; tgt_pos < tgt_length; tgt_pos += 1) {
      tgt[tgt_pos] *= scale;
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
  let maxValue = 0, lastValue = 0;
  while (src_start < src_length) {
    let src_end = src_start + ip;
    error += fp;
    if (error >= tgt_length) {
      error -= tgt_length;
      src_end += 1;
    }
    let value = 0;
    for (let pos = src_start; pos < src_end; pos += 1) {
      value += waveform[pos];
    }
    if (src_end != src_start) {
      value = value / (src_end - src_start);
    } else {
      value = lastValue;
    }
    tgt[tgt_pos] = lastValue = value;
    tgt_pos += 1;
    src_start = src_end;
  }
  return tgt;
}

function renderWaveform (ctx, {width, height, x0}, samples) {
  const midY = height / 2;
  const scaleY = height * 0.4; /* 80% scale */
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 1) {
    const y = samples[x] * scaleY;
    ctx.beginPath();
    ctx.moveTo(x0 + x + 0.5, midY - y);
    ctx.lineTo(x0 + x + 0.5, midY + y + 1);
    ctx.stroke();
  }
}

function renderEvents (ctx, {height, scale, x0}, events) {
  const lineHeight = 5;
  const y0 = (height - lineHeight) / 2;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let event of events) {
    const x = x0 + Math.round(event[0] * scale);
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

function renderRange (ctx, {scale, height, x0}, range) {
  const x1 = x0 + Math.round(range.start * scale);
  const x2 = x0 + Math.round(range.end * scale);
  ctx.fillStyle = range.color;
  ctx.fillRect(x1 + 0.5, 0, x2 - x1 + 1, height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x1 + 0.5, 0, x2 - x1 + 1, height);
}

function renderMarker (ctx, {scale, height, x0}, marker) {
  ctx.lineWidth = 2;
  ctx.lineCap = 'square';
  ctx.strokeStyle = marker.color;
  ctx.beginPath();
  const x = x0 + Math.round(marker.position * scale) + 0.5;
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
}
