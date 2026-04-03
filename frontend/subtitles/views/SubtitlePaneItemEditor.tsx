import React from "react";
import {NodeCue} from "subtitle";
import { Button } from "@blueprintjs/core";

import {formatTimeLong} from "../../common/utils";
import { ChevronLeft, ChevronRight, Plus, Trash } from "@blueprintjs/icons";

interface SubtitlePaneItemEditorProps {
    item: NodeCue,
    offset: any,
    audioTime: any,
    minStart?: any,
    maxStart?: any,
    shiftAmount?: number,
    onChange: Function,
    onInsert: Function,
    onRemove: Function,
    onShift: Function
}

/* SubtitlePaneItemEditor is used in the *editor* to show the selected, editable item in the subtitles pane. */
export class SubtitlePaneItemEditor extends React.PureComponent<SubtitlePaneItemEditorProps> {
    _textarea: HTMLTextAreaElement = null;

    render() {
        const {item: {data: {text, start, end}}, offset, audioTime, minStart, maxStart} = this.props;

        return (
            <div className='subtitles-item-editor'>
                <div className='subtitles-timestamp'>
                    <div className="row" style={{flex: '1 0'}}>
                        <div className='col-sm-6'>
                            <div className="subtitle-item-editor">
                                <span className='is-narrow'>
                                    <Button small disabled={start <= minStart} onClick={this._onShiftMinus} icon={<ChevronLeft />}/>
                                </span>
                                <span className='subtitles-timestamp-start'>{formatTimeLong(start)}</span>
                                <span className='is-narrow'>
                                    <Button
                                        small
                                        disabled={start === 0 || start >= maxStart}
                                        onClick={this._onShiftPlus}
                                        icon={<ChevronRight />}
                                    />
                                </span>
                            </div>
                        </div>
                        <div className='col-sm-6'>
                            <div className="subtitle-item-editor">
                                <span className='subtitles-timestamp-end'>{formatTimeLong(end)}</span>
                                <span className='is-narrow'>
                                    <Button small disabled={!this.props.onRemove} onClick={this._onRemove} icon={<Trash />} />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <textarea ref={this.refTextarea} className='subtitles-text' value={text} onChange={this._onChange} rows={6}/>
                <div className='subtitles-split'>
                    <p>{formatTimeLong(audioTime)}</p>
                    <span className='is-narrow'>
                        <Button small disabled={offset === 0 || audioTime < start} onClick={this._onInsertBelow} icon={<Plus />}/>
                    </span>
                </div>
            </div>
        );
    }

    componentDidMount() {
        this._textarea.focus();
    }

    refTextarea = (element) => {
        this._textarea = element;
    };
    _onChange = (event) => {
        this.props.onChange(this.props.item, event.target.value);
    };
    _onInsertBelow = () => {
        const {item, offset} = this.props;

        this.props.onInsert(item, offset, 'below');
    };
    _onRemove = () => {
        this.props.onRemove(this.props.item);
    };
    _onShiftMinus = () => {
        this.props.onShift(this.props.item, -this.props.shiftAmount);
    };
    _onShiftPlus = () => {
        this.props.onShift(this.props.item, this.props.shiftAmount);
    };
}
