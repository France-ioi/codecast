import React, {useCallback, useEffect, useRef, useState} from "react";
import classnames from 'classnames';
import {connect} from "react-redux";
import {AppStore} from "../store";

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

interface SubtitlesBandDispatchToProps {
    dispatch: Function
}

interface SubtitlesBandProps extends SubtitlesBandStateToProps, SubtitlesBandDispatchToProps {
}

function _SubtitlesBand(props: SubtitlesBandProps) {
    const {hidden, active, item, geometry, top, textHidden, windowHeight} = props;

    const bandRef = useRef<HTMLDivElement>(null);
    const [currentY, setCurrentY] = useState(0);
    const lastPositionYRef = useRef(0);
    const dragStartYRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    const clampY = useCallback((y: number) => {
        if (!windowHeight || !top) return y;
        const height = bandRef.current ? bandRef.current.offsetHeight : 40;
        return Math.min(windowHeight - top - height, Math.max(-top, y));
    }, [windowHeight, top]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        dragStartYRef.current = e.clientY;
        lastPositionYRef.current = currentY;
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [currentY]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        const deltaY = e.clientY - dragStartYRef.current;
        const newY = lastPositionYRef.current + deltaY;
        setCurrentY(clampY(newY));
    }, [isDragging, clampY]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        setCurrentY(prev => clampY(prev));
    }, [clampY]);

    if (hidden) {
        return <div style={{display: 'none'}}/>;
    }

    const translation = `translate(0px, ${currentY}px)`;

    return (
        <div
            className={classnames(['subtitles-band', `subtitles-band-${active ? '' : 'in'}active`, isDragging && 'subtitles-band-moving', 'no-select', `mainView-${geometry.size}`])}
            style={{top: `${top}px`, transform: translation, touchAction: 'none'}}
            ref={bandRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
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

export const SubtitlesBand = connect(mapStateToProps)(_SubtitlesBand);
