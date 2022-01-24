import React from "react";
import ReactDOM from "react-dom";
import {InputGroup} from "@blueprintjs/core";
import {SubtitlePaneItemEditor} from "./views/SubtitlePaneItemEditor";
import {SubtitlePaneItemViewer} from "./views/SubtitlePaneItemViewer";
import {IconNames} from "@blueprintjs/icons";
import {SubtitlePaneItem} from "./SubtitlePaneItem";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {NodeCue} from "subtitle";
import {getMessage} from "../lang";

interface SubtitlesPaneStateToProps {
    subtitles: any[],
    currentIndex: number,
    editing?: boolean,
    audioTime: number,
    filterText: string,
    filterRegexp: string,
    windowHeight: number,
}

function mapStateToProps(state: AppStore): SubtitlesPaneStateToProps {
    const windowHeight = state.windowHeight;
    const {filteredItems, currentIndex, audioTime, filterText, filterRegexp} = state.subtitles;

    return {
        subtitles: filteredItems,
        currentIndex,
        audioTime,
        filterText,
        filterRegexp,
        windowHeight
    };
}

interface SubtitlesPaneDispatchToProps {
    dispatch: Function
}

interface SubtitlesPaneProps extends SubtitlesPaneStateToProps, SubtitlesPaneDispatchToProps {

}

class _SubtitlesPane extends React.PureComponent<SubtitlesPaneProps> {
    _selectedComponent: any = null;

    render() {
        const {subtitles, currentIndex, editing, audioTime, filterText, filterRegexp, windowHeight} = this.props;

        return (
            <div className='subtitles-pane subtitles-pane-view vbox'>
                {!editing &&
                    <InputGroup
                        leftIcon={IconNames.SEARCH}
                        type='text'
                        onChange={this._filterTextChanged}
                        value={filterText}
                    />
                }
                <div className='subtitles-pane-items fill'>
                    {subtitles && subtitles.map((subtitle, index) => {
                        const selected = (currentIndex === index);
                        if (!editing) {
                            const ref = selected && this._refSelected;

                            return <SubtitlePaneItem
                                key={index}
                                item={subtitle}
                                ref={ref}
                                selected={selected}
                                onJump={this._jump}
                                highlight={filterRegexp}
                            />;
                        }
                        if (selected) {
                            return <SubtitlePaneItemEditor
                                key={index}
                                item={subtitle}
                                ref={this._refSelected}
                                offset={audioTime - subtitle.start}
                                audioTime={audioTime}
                                onChange={this._changeItem}
                                onInsert={this._insertItem}
                                onRemove={this._removeItem}
                                onShift={this._shiftItem}
                            />;
                        }

                        return <SubtitlePaneItemViewer
                            key={index}
                            item={subtitle}
                            onJump={this._jump}
                        />;
                    })}
                </div>
                {!subtitles &&
                    <p>{getMessage('CLOSED_CAPTIONS_NOT_LOADED')}</p>
                }
            </div>
        );
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.currentIndex !== prevProps.currentIndex) {
            if (this._selectedComponent) {
                // eslint-disable-next-line
                const item = ReactDOM.findDOMNode(this._selectedComponent);
                const container = item.parentElement;

                if (item instanceof HTMLElement) {
                    container.scrollTop = (item.offsetTop - container.offsetTop) + (item.clientHeight - container.clientHeight) / 2;
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
    _removeItem = (subtitle: NodeCue, merge) => {
        const index = this.props.subtitles.indexOf(subtitle);

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

export const SubtitlesPane = connect(mapStateToProps)(_SubtitlesPane);
