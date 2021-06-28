import React from "react";
import ReactDOM from "react-dom";
import scrollIntoView from "scroll-into-view-if-needed";
import {SubtitlePaneItemEditor} from "./SubtitlePaneItemEditor";
import {SubtitlePaneItemViewer} from "./SubtitlePaneItemViewer";
import {ActionTypes} from "../actionTypes";
import {ActionTypes as PlayerActionTypes} from "../../player/actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {NodeCue} from "subtitle";

interface SubtitlesEditorPaneStateToProps {
    subtitles: NodeCue[],
    currentIndex: number,
    audioTime: number,
    getMessage: Function
}

function mapStateToProps(state: AppStore): SubtitlesEditorPaneStateToProps {
    const getMessage = state.getMessage;
    const {items, currentIndex, audioTime} = state.subtitles;

    return {
        getMessage,
        subtitles: items,
        currentIndex,
        audioTime
    };
}

interface SubtitlesEditorPaneDispatchToProps {
    dispatch: Function
}

interface SubtitlesEditorPaneProps extends SubtitlesEditorPaneStateToProps, SubtitlesEditorPaneDispatchToProps {

}

class _SubtitlesEditorPane extends React.PureComponent<SubtitlesEditorPaneProps> {
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
            return null;
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
                // eslint-disable-next-line
                const domNode = ReactDOM.findDOMNode(this._selectedComponent);

                if (domNode instanceof Element) {
                    scrollIntoView(domNode, {
                        block: 'center',
                        behavior: 'smooth'
                    });
                }
            }
        }
    }

    _refSelected = (component) => {
        this._selectedComponent = component;
    };
    _jump = (subtitle: NodeCue) => {
        this.props.dispatch({type: PlayerActionTypes.PlayerSeek, payload: {audioTime: subtitle.data.start}});
    };
    _changeItem = (subtitle: NodeCue, text) => {
        const index = this.props.subtitles.indexOf(subtitle);

        this.props.dispatch({type: ActionTypes.SubtitlesItemChanged, payload: {index, text}});
    };
    _insertItem = (subtitle: NodeCue, offset, where) => {
        const index = this.props.subtitles.indexOf(subtitle);

        this.props.dispatch({type: ActionTypes.SubtitlesItemInserted, payload: {index, offset, where}});
    };
    _removeItem = (subtitle: NodeCue) => {
        const index = this.props.subtitles.indexOf(subtitle);
        const merge = index === 0 ? 'down' : 'up';

        this.props.dispatch({type: ActionTypes.SubtitlesItemRemoved, payload: {index, merge}});
    };
    _shiftItem = (subtitle: NodeCue, amount) => {
        const index = this.props.subtitles.indexOf(subtitle);

        this.props.dispatch({type: ActionTypes.SubtitlesItemShifted, payload: {index, amount}});
    };
    _filterTextChanged = (event) => {
        const text = event.target.value;
        this.props.dispatch({type: ActionTypes.SubtitlesFilterTextChanged, payload: {text}});
    };
}

export const SubtitlesEditorPane = connect(mapStateToProps)(_SubtitlesEditorPane);
