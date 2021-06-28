import React from "react";
import {Button, Checkbox} from "@blueprintjs/core";
import {ExpandedWaveform} from "./waveform/ExpandedWaveform";
import {FullWaveform} from "./waveform/FullWaveform";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes"
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {IconNames} from "@blueprintjs/icons";

interface TrimEditorControlsProps {
    width: number
}

export function TrimEditorControls(props: TrimEditorControlsProps) {
    const {width} = props;

    const editor = useAppSelector(state => state.editor);
    const player = useAppSelector(state => state.player);
    const getMessage = useAppSelector(state => state.getMessage);
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

    const dispatch = useDispatch();

    const seekTo = (position) => {
        dispatch({type: PlayerActionTypes.PlayerSeek, payload: {audioTime: position}});
    };
    const addMarker = () => {
        dispatch({type: ActionTypes.EditorTrimMarkerAdded, payload: {position}});
    };
    const removeMarker = () => {
        dispatch({type: ActionTypes.EditorTrimMarkerRemoved, payload: {position: selectedMarker}});
    };
    const intervalSkipChanged = (event) => {
        const skip = event.target.checked;
        let {value} = selectedInterval;

        dispatch({
            type: ActionTypes.EditorTrimIntervalChanged,
            payload: {position, value: {...value, skip}}
        });
    };
    const intervalMuteChanged = (event) => {
        let {value} = selectedInterval;
        const mute = event.target.checked;

        dispatch({
            type: ActionTypes.EditorTrimIntervalChanged,
            payload: {position, value: {...value, mute}}
        });
    };

    const save = () => {
        const {targetUrl} = this.state;
        const grant = this.props.grants.find(grant => grant.url === targetUrl);
        if (grant) {
            dispatch({type: ActionTypes.EditorTrimSave, payload: {target: grant}});
        }
    };

    return (
        <div>
            <div className='hbox trim-editor-controls'>
                <div className="trim-editor-controls-buttons">
                    <Button onClick={addMarker} text={getMessage('EDITOR_SPLIT')} icon='split-columns'/>
                    <Button onClick={removeMarker} text={getMessage('EDITOR_MERGE')} icon='merge-columns'/>
                    <div className='trim-selection-controls'>
                        <Checkbox checked={selectedInterval.value.skip} onChange={intervalSkipChanged}>
                            {getMessage('EDITOR_SKIP')}
                        </Checkbox>
                        <Checkbox checked={selectedInterval.value.mute} onChange={intervalMuteChanged}>
                            {getMessage('EDITOR_MUTE')}
                        </Checkbox>
                    </div>
                </div>
                <Button onClick={save} icon={IconNames.CLOUD_UPLOAD} text={getMessage('EDITOR_SUBTITLES_SAVE')} />
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
                onPan={seekTo}
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
                onPan={seekTo}
            />
        </div>
    );
}
