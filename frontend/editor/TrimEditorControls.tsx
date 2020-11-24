import React from "react";
import {Button, Checkbox} from "@blueprintjs/core";
import {ExpandedWaveform} from "./waveform/ExpandedWaveform";
import {FullWaveform} from "./waveform/FullWaveform";
import {ActionTypes} from "./actionTypes";

interface TrimEditorControlsProps {
    position: any,
    viewStart: any,
    viewEnd: any,
    duration: any,
    waveform: any,
    events: any,
    width: any,
    intervals: any,
    selectedMarker: any,
    selectedInterval: any,
    dispatch: Function
}

export class TrimEditorControls extends React.PureComponent<TrimEditorControlsProps> {
    render() {
        const {position, viewStart, viewEnd, duration, waveform, events, width, intervals, selectedMarker, selectedInterval} = this.props;
        return (
            <div>
                <div className='hbox'>
                    <Button onClick={this.addMarker} text="Split" icon='split-columns'/>
                    <Button onClick={this.removeMarker} text="Merge" icon='merge-columns'/>
                    <div className='hbox trim-selection-controls'>
                        {/* TODO: side by side */}
                        <Checkbox checked={selectedInterval.value.skip} onChange={this.intervalSkipChanged}>
                            {"Skip"}
                        </Checkbox>
                        <Checkbox checked={selectedInterval.value.mute} onChange={this.intervalMuteChanged}>
                            {"Mute"}
                        </Checkbox>
                    </div>
                </div>
                <ExpandedWaveform
                    height={100} width={width} position={position} duration={duration}
                    selectedMarker={selectedMarker}
                    waveform={waveform} events={events} intervals={intervals}
                    onPan={this.seekTo}/>
                <FullWaveform
                    height={60} width={width} position={position} duration={duration}
                    selectedMarker={selectedMarker} viewStart={viewStart} viewEnd={viewEnd}
                    waveform={waveform} events={events} intervals={intervals}
                    onPan={this.seekTo}/>
            </div>
        );
    }

    seekTo = (position) => {
        this.props.dispatch({type: this.props.actionTypes.playerSeek, payload: {audioTime: position}});
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
