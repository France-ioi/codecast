import React from "react";
import {Button, Checkbox} from "@blueprintjs/core";
import {ExpandedWaveform} from "./waveform/ExpandedWaveform";
import {FullWaveform} from "./waveform/FullWaveform";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes"
import {connect} from "react-redux";
import {AppStore} from "../store";

interface TrimEditorControlsStateToProps {
    position: number,
    viewStart: number,
    viewEnd: number,
    duration: number,
    waveform: any,
    events: any,
    intervals: any,
    selectedMarker: number,
    selectedInterval: any
}

function mapStateToProps(state: AppStore, props): TrimEditorControlsStateToProps {
    const {width} = props;
    const editor = state.editor;
    const player = state.player;
    const position = Math.round(player.audioTime);
    const duration = player.duration;
    const waveform = editor.waveform;
    const {events} = editor.data;
    const {intervals} = editor.trim;
    const visibleDuration = width * 1000 / 60;
    let viewStart = position - visibleDuration / 2;
    let viewEnd = position + visibleDuration / 2;
    if (viewStart < 0) {
        viewStart = 0;
    } else if (viewEnd > duration) {
        viewStart = Math.max(0, duration - visibleDuration);
    }
    viewEnd = viewStart + visibleDuration;
    const selectedInterval = intervals.get(position);
    const diffToStart = position - selectedInterval.start;
    const diffToEnd = selectedInterval.end - position;
    const selectedMarker = diffToStart <= diffToEnd ? selectedInterval.start : selectedInterval.end;

    return {
        position, viewStart, viewEnd, duration, waveform, events, intervals,
        selectedMarker, selectedInterval
    };
}

interface TrimEditorControlsDispatchToProps {
    dispatch: Function
}

interface TrimEditorControlsProps extends TrimEditorControlsStateToProps, TrimEditorControlsDispatchToProps {
    width: number
}

class _TrimEditorControls extends React.PureComponent<TrimEditorControlsProps> {
    render() {
        const {position, viewStart, viewEnd, duration, waveform, events, width, intervals, selectedMarker, selectedInterval} = this.props;
        return (
            <div>
                <div className='hbox'>
                    <Button onClick={this.addMarker} text="Split" icon='split-columns'/>
                    <Button onClick={this.removeMarker} text="Merge" icon='merge-columns'/>
                    <div className='hbox trim-selection-controls'>
                        <Checkbox checked={selectedInterval.value.skip} onChange={this.intervalSkipChanged}>
                            {"Skip"}
                        </Checkbox>
                        <Checkbox checked={selectedInterval.value.mute} onChange={this.intervalMuteChanged}>
                            {"Mute"}
                        </Checkbox>
                    </div>
                </div>
                <ExpandedWaveform
                    height={100}
                    width={width}
                    position={position}
                    duration={duration}
                    selectedMarker={selectedMarker}
                    waveform={waveform}
                    events={events}
                    intervals={intervals}
                    onPan={this.seekTo}
                />
                <FullWaveform
                    height={60}
                    width={width}
                    position={position}
                    duration={duration}
                    selectedMarker={selectedMarker}
                    viewStart={viewStart}
                    viewEnd={viewEnd}
                    waveform={waveform}
                    events={events}
                    intervals={intervals}
                    onPan={this.seekTo}
                />
            </div>
        );
    }

    seekTo = (position) => {
        this.props.dispatch({type: PlayerActionTypes.PlayerSeek, payload: {audioTime: position}});
    };
    addMarker = () => {
        const {position} = this.props;
        this.props.dispatch({type: ActionTypes.EditorTrimMarkerAdded, payload: {position}});
    };
    removeMarker = () => {
        const position = this.props.selectedMarker;
        this.props.dispatch({type: ActionTypes.EditorTrimMarkerRemoved, payload: {position}});
    };
    intervalSkipChanged = (event) => {
        const {position, selectedInterval} = this.props;
        const skip = event.target.checked;
        let {value} = selectedInterval;

        this.props.dispatch({
            type: ActionTypes.EditorTrimIntervalChanged,
            payload: {position, value: {...value, skip}}
        });
    };
    intervalMuteChanged = (event) => {
        const {position, selectedInterval} = this.props;
        let {value} = selectedInterval;
        const mute = event.target.checked;

        this.props.dispatch({
            type: ActionTypes.EditorTrimIntervalChanged,
            payload: {position, value: {...value, mute}}
        });
    };
}

export const TrimEditorControls = connect(mapStateToProps)(_TrimEditorControls);
