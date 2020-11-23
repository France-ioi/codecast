import React from 'react';
import ReactDOM from 'react-dom';
import Highlight from 'react-highlighter';
import {InputGroup} from '@blueprintjs/core';
import {IconNames} from "@blueprintjs/icons";
import {NodeCue} from 'subtitle';
import classnames from 'classnames';

import {filterItems} from './utils';
import {SubtitlePaneItemEditor} from "./views/SubtitlePaneItemEditor";
import {SubtitlePaneItemViewer} from "./views/SubtitlePaneItemViewer";
import {formatTime} from "../common/utils";

export default function (bundle) {
    bundle.defineView('SubtitlesPane', SubtitlesPaneSelector, SubtitlesPane);
    bundle.defineAction('subtitlesFilterTextChanged', 'Subtitles.Pane.FilterText.Changed');
    bundle.addReducer('subtitlesFilterTextChanged', subtitlesFilterTextChangedReducer);
}

function SubtitlesPaneSelector(state, props) {
    const getMessage = state.get('getMessage');
    const {subtitlesFilterTextChanged, playerSeek} = state.get('actionTypes');
    const windowHeight = state.get('windowHeight');
    const {filteredItems, currentIndex, audioTime, filterText, filterRegexp} = state.get('subtitles');

    return {
        subtitlesFilterTextChanged, playerSeek, getMessage,
        subtitles: filteredItems,
        currentIndex, audioTime, filterText, filterRegexp, windowHeight
    };
}

interface SubtitlesPaneProps {
    subtitles: any,
    currentIndex: any,
    editing: any,
    audioTime: any,
    filterText: any,
    filterRegexp: any,
    getMessage: any,
    windowHeight: any,
    dispatch: Function,
    playerSeek: string,
    subtitlesItemChanged: string,
    subtitlesItemInserted: string,
    subtitlesItemRemoved: string,
    subtitlesItemShifted: string,
    subtitlesFilterTextChanged: string
}

class SubtitlesPane extends React.PureComponent<SubtitlesPaneProps> {
    _selectedComponent: any = null;

    render() {
        const {subtitles, currentIndex, editing, audioTime, filterText, filterRegexp, getMessage, windowHeight} = this.props;

        return (
            <div className='subtitles-pane vbox' style={{height: `${windowHeight - 89}px`}}>
                {!editing &&
                <InputGroup leftIcon={IconNames.SEARCH} type='text' onChange={this._filterTextChanged}
                            value={filterText}/>
                }
                <div className='subtitles-pane-items fill'>
                    {subtitles &&
                    subtitles.map((subtitle, index) => {
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
                    })
                    }
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
    _jump = (subtitle) => {
        this.props.dispatch({type: this.props.playerSeek, payload: {audioTime: subtitle.start}});
    };
    _changeItem = (item, text) => {
        const index = this.props.subtitles.indexOf(item);
        this.props.dispatch({type: this.props.subtitlesItemChanged, payload: {index, text}});
    };
    _insertItem = (item, offset, where) => {
        const index = this.props.subtitles.indexOf(item);
        this.props.dispatch({type: this.props.subtitlesItemInserted, payload: {index, offset, where}});
    };
    _removeItem = (item, merge) => {
        const index = this.props.subtitles.indexOf(item);
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

interface SubtitlePaneItemProps {
    item: NodeCue,
    selected: any,
    highlight: any,
    onJump: Function
}

/* SubtitlePaneItem is used in the *player* to show an item in the subtitles pane. */
class SubtitlePaneItem extends React.PureComponent<SubtitlePaneItemProps> {
    render() {
        const {item: {data: {text, start}}, selected, highlight} = this.props;
        const showTimestamps = false;

        return (
            <p className={classnames(['subtitles-item', selected && 'subtitles-item-selected'])}
               onClick={this._onClick}>
                {showTimestamps && <span className='subtitles-timestamp'>{formatTime(start)}</span>}
                <span className='subtitles-text'>
          <Highlight search={highlight || ''}>{text}</Highlight>
        </span>
            </p>
        );
    }

    _onClick = () => {
        this.props.onJump(this.props.item);
    };
}

function subtitlesFilterTextChangedReducer(state, {payload: {text}}) {
    return state.update('subtitles', function (subtitles) {
        let re = null;
        if (text) {
            try {
                re = new RegExp(text, 'i');
            } catch (ex) {
                /* silently ignore error, keep last regexp */
                re = subtitles.filterRegexp;
            }
        }
        return {
            ...subtitles,
            filterText: text,
            filterRegexp: re,
            filteredItems: filterItems(subtitles.items, re)
        };
    });
}
