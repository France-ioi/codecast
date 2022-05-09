import React from 'react';

import {canvasToTimestamp, renderCursor, renderEvents, renderMarker, renderRange} from './tools';

interface ExpandedWaveformProps {
    height: number,
    width: number,
    position: any,
    onPan: Function,
    duration: any,
    waveform: any,
    events: any,
    intervals: any,
    selectedMarker: any
}

export class ExpandedWaveform extends React.PureComponent<ExpandedWaveformProps> {
    canvas: HTMLCanvasElement = null;
    state = {
        mode: 'idle',
        refX: null,
        refT: null
    };

    render() {
        return <canvas height={this.props.height} width={this.props.width} ref={this.refCanvas}
            onMouseDown={this.mouseDown} onMouseUp={this.mouseUp} onMouseMove={this.mouseMove}
            style={{cursor: 'move'}}/>;
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
        if (this.state.mode === 'idle') {
            return;
        }
        if (event.buttons === 0) {
            this.setState({mode: 'idle'});

            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const newX = event.clientX - rect.left;
        // @ts-ignore
        const deltaT = (newX - this.state.refX) / this._params.scale;
        this.props.onPan(this.state.refT - deltaT);
    };
    updateCanvas = () => {
        // @ts-ignore
        this._params = render(this.props, this.canvas, this._params);
    };
}

function render(props: ExpandedWaveformProps, canvas, prevParams) {
    const {position, duration, waveform, events, intervals, selectedMarker} = props;
    const {width, height} = canvas;
    const scale = 60 / 1000; /* Fixed scale: 60 pixels per 1000ms */
    let firstSample, leftMargin = 0;
    const currentSample = Math.round(position * 60 / 1000);
    const maxSample = Math.floor(duration * 60 / 1000);
    firstSample = Math.min(maxSample, Math.max(-width / 2, Math.round(currentSample - width / 2)));
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
    if (intervals) {
        for (let p of intervals.keys) {
            renderMarker(ctx, params, {
                position: p,
                color: p === selectedMarker ? '#ff00ff' : '#ff0000',
                lineWidth: p === selectedMarker ? 4 : 2,
            });
        }
    }
    renderCursor(ctx, params, {position, alpha: 0.9});
    return params;
}

function renderWaveform(ctx, params, samples, intervals) {
    /* Assumes `samples` is computed such that 1 sample corresponds to 1 canvas pixel. */
    const {duration, width, height, leftMargin, firstTimestamp, lastTimestamp} = params;
    const timescale = samples.length / duration;
    const firstIndex = Math.round(canvasToTimestamp(params, leftMargin) * timescale);
    const midY = height / 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d8d8d8';
    for (let x = 0; x < width; x += 1) {
        const y = samples[firstIndex + x] * height;
        if (intervals && intervals.get(canvasToTimestamp(params, x)).value.mute) {
            continue;
        }
        ctx.beginPath();
        ctx.moveTo(leftMargin + x + 0.5, midY - y);
        ctx.lineTo(leftMargin + x + 0.5, midY + y + 1);
        ctx.stroke();
    }
}

function renderTicks(ctx, params) {
    const {width, height, leftMargin} = params;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    const position = canvasToTimestamp(params, leftMargin);
    for (let x = 0.5 + 60 - Math.round(position * 60 / 1000) % 60; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}
