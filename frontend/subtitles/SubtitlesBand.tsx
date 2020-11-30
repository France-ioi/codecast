import React from "react";
import classnames from 'classnames';

interface SubtitlesBandProps {
    hidden: any,
    active: any,
    item: any,
    geometry: any,
    offsetY: any,
    dataDrag: {
        isMoving: any,
    },
    top: any,
    textHidden: any
}

export class SubtitlesBand extends React.PureComponent<SubtitlesBandProps> {
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
                style={{top: `${top}px`, transform: translation, width: `${geometry.width}px`}}
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

    state = {band: null, currentY: 0, lastPositionY: 0};
    _refBand = (element) => {
        this.setState({band: element});
    };
}
