import {NodeCue} from "subtitle";
import React from "react";
import {formatTimeLong} from "../../common/utils";
import {Icon} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";

interface SubtitlePaneItemViewerProps {
    item: NodeCue,
    onJump: Function
}

/* SubtitlePaneItemViewer is used in the *editor* to show an inactive item in the subtitles pane. */
export class SubtitlePaneItemViewer extends React.PureComponent<SubtitlePaneItemViewerProps> {
    render() {
        const {item: {data: {text, start, end}}} = this.props;

        return (
            <div className='subtitles-item-viewer' onClick={this._onClick}>
                <div className='subtitles-timestamp'>
                    <div className='subtitles-timestamp-start-end'>
                        <span className='subtitles-timestamp-start'>{formatTimeLong(start)}</span>
                    </div>
                    <div>
                        <Icon icon={IconNames.ARROW_RIGHT} iconSize={14}/>
                    </div>
                    <div className='subtitles-timestamp-start-end'>
                        <span className='subtitles-timestamp-end'>{formatTimeLong(end)}</span>
                    </div>
                </div>
                <span className='subtitles-text'>
          {text}
        </span>
            </div>
        );
    }

    _onClick = () => {
        this.props.onJump(this.props.item);
    };
}
