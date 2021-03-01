import {NodeCue} from "subtitle";
import React from "react";
import classnames from 'classnames';
import {formatTime} from "../common/utils";
import Highlight from 'react-highlighter';

interface SubtitlePaneItemProps {
    item: NodeCue,
    selected: any,
    highlight: any,
    onJump: Function
}

/* SubtitlePaneItem is used in the *player* to show an item in the subtitles pane. */
export class SubtitlePaneItem extends React.PureComponent<SubtitlePaneItemProps> {
    render() {
        const {item: {data: {text, start}}, selected, highlight} = this.props;
        const showTimestamps = false;

        return (
            <p className={classnames(['subtitles-item', selected && 'subtitles-item-selected'])} onClick={this._onClick}>
                {showTimestamps &&
                    <span className='subtitles-timestamp'>{formatTime(start)}</span>
                }
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
