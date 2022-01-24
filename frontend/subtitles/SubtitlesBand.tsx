import React from "react";
import classnames from 'classnames';
import {connect} from "react-redux";
import {AppStore} from "../store";
import clickDrag from 'react-clickdrag';

interface SubtitlesBandStateToProps {
    hidden: boolean,
    active?: boolean,
    item?: any,
    geometry?: any,
    offsetY?: number,
    top?: number,
    textHidden?: boolean,
    isMoving?: boolean,
    windowHeight?: number,
}

function mapStateToProps(state: AppStore): SubtitlesBandStateToProps {
    const {
        loaded, editing, bandEnabled,
        items, currentIndex, itemVisible, isMoving, offsetY
    } = state.subtitles;

    const item = items && items[currentIndex];
    const subtitleData = item && item.data;
    if (!subtitleData || !subtitleData.text || !loaded || (!editing && !bandEnabled)) {
        return {hidden: true};
    }

    let textHidden = false;

    const trim = state.editor.trim;
    if (trim && trim.intervals) {
        const interval = trim.intervals.get(subtitleData.start);
        if (interval && (interval.value.mute || interval.value.skip)) {
            if (interval.start <= subtitleData.start) {
                textHidden = true;
            }
        }
    }

    const geometry = state.mainViewGeometry;
    const windowHeight = state.windowHeight;

    return {
        top: windowHeight - 170,
        active: itemVisible,
        item,
        isMoving,
        offsetY,
        geometry,
        textHidden,
        windowHeight,
        hidden: false,
    };
}

interface PlayerAppDispatchToProps {
    dispatch: Function
}

interface DataDrag {
    dataDrag: {
        isMouseDown: boolean,
        isMoving: boolean,
        mouseDownPositionX: number,
        mouseDownPositionY: number,
        moveDeltaX: number,
        moveDeltaY: number
    }
}

interface SubtitlesBandProps extends SubtitlesBandStateToProps, PlayerAppDispatchToProps, DataDrag {

}

class _SubtitlesBand extends React.PureComponent<SubtitlesBandProps> {
    state = {
        band: null,
        currentY: 0,
        lastPositionY: 0
    };

    render() {
        const {hidden} = this.props;
        if (hidden) {
            /* ClickDrag requires a DOM node to attach to, so return a hidden element
               rather than false. */
            return <div style={{display: 'none'}}/>;
        }

        const {active, item, geometry, dataDrag: {isMoving}, top, textHidden} = this.props;
        const translation = `translate(0px, ${this.state.currentY}px)`;

        return (
            <div
                className={classnames(['subtitles-band', `subtitles-band-${active ? '' : 'in'}active`, isMoving && 'subtitles-band-moving', 'no-select', `mainView-${geometry.size}`])}
                style={{top: `${top}px`, transform: translation}}
                ref={this._refBand}
            >
                <div className='subtitles-band-frame'>
                    {item &&
                        <p className='subtitles-text' style={{textDecoration: textHidden ? 'line-through' : 'none'}}>
                            {item.data.text}
                        </p>
                    }
                </div>
            </div>
        );
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (!nextProps.windowHeight) return null;
        const height = (prevState.band ? prevState.band.offsetHeight : 40);
        if (nextProps.dataDrag.isMoving) {
            const newPositionY = prevState.lastPositionY + nextProps.dataDrag.moveDeltaY;
            const currentY = Math.min(nextProps.windowHeight - nextProps.top - height, Math.max(-nextProps.top, newPositionY));

            return {currentY};
        } else {
            const currentY = Math.min(nextProps.windowHeight - nextProps.top - height, Math.max(-nextProps.top, prevState.currentY));

            return {currentY, lastPositionY: currentY};
        }
    }

    _refBand = (element) => {
        this.setState({band: element});
    };
}

export const SubtitlesBand = clickDrag(connect(mapStateToProps)(_SubtitlesBand), {touch: true});
