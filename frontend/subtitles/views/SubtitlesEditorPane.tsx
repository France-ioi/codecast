import React from "react";
import ReactDOM from "react-dom";
import scrollIntoViewIfNeeded from "scroll-into-view-if-needed";
import {SubtitlePaneItemEditor} from "./SubtitlePaneItemEditor";
import {SubtitlePaneItemViewer} from "./SubtitlePaneItemViewer";

interface SubtitlesEditorPaneProps {
    subtitles: any,
    currentIndex: any,
    audioTime: any,
    getMessage: any,
    dispatch: Function,
    playerSeek: string,
    subtitlesItemChanged: string,
    subtitlesItemInserted: string,
    subtitlesItemRemoved: string,
    subtitlesItemShifted: string,
    subtitlesFilterTextChanged: string
}

export class SubtitlesEditorPane extends React.PureComponent<SubtitlesEditorPaneProps> {
    _selectedComponent: SubtitlePaneItemEditor = null;

    render() {
        const {subtitles, currentIndex, audioTime, getMessage} = this.props;
        const items = [];
        let message = null;
        const shiftAmount = 200;

        if (subtitles && subtitles.length > 0) {
            let prevStart = 0;
            const canRemove = subtitles.length > 1;
            subtitles.forEach((subtitle, index) => {
                const selected = currentIndex === index;
                if (selected) {
                    items.push(<SubtitlePaneItemEditor
                        key={index}
                        item={subtitle}
                        ref={this._refSelected}
                        offset={audioTime - subtitle.data.start}
                        audioTime={audioTime}
                        onChange={this._changeItem}
                        onInsert={this._insertItem}
                        onRemove={canRemove && this._removeItem}
                        onShift={this._shiftItem}
                        minStart={prevStart + shiftAmount}
                        maxStart={subtitle.data.end - shiftAmount}
                        shiftAmount={shiftAmount}
                    />);
                } else {
                    items.push(<SubtitlePaneItemViewer
                        key={index}
                        item={subtitle}
                        onJump={this._jump}/>
                    );
                }
                prevStart = subtitle.data.start;
            });
        } else {
            message = <p>{getMessage('CLOSED_CAPTIONS_NOT_LOADED')}</p>;
        }
        return (
            <div className='subtitles-pane'>
                {items}
                {message}
            </div>
        );
    }

    componentDidUpdate(prevProps) {
        if (this.props.currentIndex !== prevProps.currentIndex) {
            if (this._selectedComponent) {
                const domNode = ReactDOM.findDOMNode(this._selectedComponent);

                if (domNode instanceof Element) {
                    scrollIntoViewIfNeeded(domNode, {
                        centerIfNeeded: true,
                        easing: 'ease',
                        duration: 300
                    });
                }
            }
        }
    }

    _refSelected = (component) => {
        this._selectedComponent = component;
    };
    _jump = (subtitle) => {
        this.props.dispatch({type: this.props.playerSeek, payload: {audioTime: subtitle.data.start}});
    };
    _changeItem = (item, text) => {
        const index = this.props.subtitles.indexOf(item);
        this.props.dispatch({type: this.props.subtitlesItemChanged, payload: {index, text}});
    };
    _insertItem = (item, offset, where) => {
        const index = this.props.subtitles.indexOf(item);
        this.props.dispatch({type: this.props.subtitlesItemInserted, payload: {index, offset, where}});
    };
    _removeItem = (item) => {
        const index = this.props.subtitles.indexOf(item);
        const merge = index === 0 ? 'down' : 'up';
        this.props.dispatch({type: this.props.subtitlesItemRemoved, payload: {index, merge}});
    };
    _shiftItem = (item, amount) => {
        const index = this.props.subtitles.indexOf(item);
        this.props.dispatch({type: this.props.subtitlesItemShifted, payload: {index, amount}});
    };
    _filterTextChanged = (event) => {
        const text = event.target.value;
        this.props.dispatch({type: this.props.subtitlesFilterTextChanged, payload: {text}});
    };
}
