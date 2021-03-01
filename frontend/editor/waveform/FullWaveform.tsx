import React from 'react';

import {canvasToTimestamp, renderCursor, renderEvents, renderMarker, renderRange} from './tools';

interface FullWaveformProps {
    onPan?: Function,
    width: number,
    height: number,
    duration: any,
    position?: any,
    waveform: any,
    events: any,
    viewStart?: any,
    viewEnd?: any,
    intervals?: any,
    selectedMarker?: any
}

export class FullWaveform extends React.PureComponent<FullWaveformProps> {
    canvas: HTMLCanvasElement = null;
    state = {mode: 'idle'};

    render() {
        const {onPan, width, height} = this.props;
        return <canvas width={width} height={height} ref={this.refCanvas}
                       onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove}
                       style={{cursor: onPan ? 'pointer' : 'default'}}/>;
    }

    componentDidMount() {
        this.updateCanvas();
    }

    componentDidUpdate() {
        this.updateCanvas();
    }

    refCanvas = (canvas) => {
        this.canvas = canvas;
    };
    updateCanvas = () => {
        // @ts-ignore
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
        if (this.state.mode === 'idle') {
            return;
        }
        if (event.buttons === 0) {
            this.setState({mode: 'idle'});

            return;
        }

        this.panned(event.clientX);
    };
    panned = (x) => {
        const {onPan} = this.props;
        if (onPan) {
            const rect = this.canvas.getBoundingClientRect();
            // @ts-ignore
            onPan(canvasToTimestamp(this._params, x - rect.left));
        }
    };
}

function render(props: FullWaveformProps, canvas, prevParams) {
    const {duration, position, waveform, events, viewStart, viewEnd, intervals, selectedMarker} = props;
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
        // @ts-ignore
        params.miniWaveform = prevParams.miniWaveform;
    } else {
        // @ts-ignore
        params.miniWaveform = downsampleWaveform(waveform, useableWidth);
    }
    // @ts-ignore
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
            renderMarker(ctx, params, {
                position: p,
                color: p === selectedMarker ? '#ff00ff' : '#ff0000',
                lineWidth: p === selectedMarker ? 4 : 2,
            });
        }
    }
    if (typeof position === 'number') {
        renderCursor(ctx, params, {position, alpha: 0.7});
    }
    return params;
}

function downsampleWaveform(waveform, tgt_length) {
    const src_length = waveform.length;
    let src_start = 0;
    let ip = Math.floor(src_length / tgt_length);
    let fp = src_length % tgt_length;
    let error = 0;
    let tgt_pos = 0;
    const avgValues = new Float32Array(tgt_length);
    const maxValues = new Float32Array(tgt_length);
    while (src_start < src_length) {
        let src_next = src_start + ip;
        error += fp;
        if (error >= tgt_length) {
            error -= tgt_length;
            src_next += 1;
        }
        let sum = 1, maxValue = 0;
        for (let pos = src_start; pos < src_next; pos += 1) {
            sum += waveform[pos];
            maxValue = Math.max(maxValue, waveform[pos]);
        }
        avgValues[tgt_pos] = sum / (src_next - src_start);
        maxValues[tgt_pos] = maxValue;
        tgt_pos += 1;
        src_start = src_next;
    }
    return {nSamples: tgt_length, avgValues, maxValues};
}

function renderMiniWaveform(ctx, params, miniWaveform, intervals) {
    /* Assumes samples is computed such that 1 sample corresponds to 1 canvas pixel. */
    const {duration, width, height, leftMargin, firstTimestamp, lastTimestamp} = params;
    const {nSamples, avgValues, maxValues} = miniWaveform;
    const midY = height / 2;
    ctx.lineWidth = 1;
    for (let i = 0; i < nSamples; i += 1) {
        const x = leftMargin + i + 0.5;
        if (intervals && intervals.get(canvasToTimestamp(params, x)).value.mute) {
            continue;
        }
        const yAvg = avgValues[i] * height;
        const yMax = maxValues[i] * height;
        ctx.strokeStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.moveTo(x, midY - yMax);
        ctx.lineTo(x, midY + yMax + 1);
        ctx.stroke();
        ctx.strokeStyle = '#d8d8d8';
        ctx.beginPath();
        ctx.lineTo(x, midY - yAvg);
        ctx.lineTo(x, midY + yAvg + 1);
        ctx.stroke();
    }
}
