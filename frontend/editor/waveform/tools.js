
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

export function renderEvents (ctx, params, events) {
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

export function renderRange (ctx, params, range) {
  const {scale, width, height, leftMargin, firstSample} = params;
  const x1 = timestampToCanvas(params, range.start);
  const x2 = timestampToCanvas(params, range.end);
  if (x2 >= 0 && x1 <= width) {
    ctx.fillStyle = range.color;
    ctx.fillRect(x1 + 0.5, 0, x2 - x1 + 1, height);
    ctx.lineWidth = 1;
    // ctx.strokeStyle = '#000';
    // ctx.strokeRect(x1 + 0.5, 0, x2 - x1 + 1, height);
  }
}

export function renderMarker (ctx, params, {position, color}) {
  const {width, height, leftMargin, firstSample} = params;
  const x = Math.round(timestampToCanvas(params, position));
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

export function timestampToCanvas (params, timestamp) {
  return params.leftMargin + (timestamp - params.firstTimestamp) * params.scale;
}

export function canvasToTimestamp (params, x) {
  return params.firstTimestamp + (x - params.leftMargin) / params.scale;
}
