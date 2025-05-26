import React, {useCallback, useEffect, useRef, useState} from 'react';
import {LayoutElementMetadata} from "./layout";
import {Directive} from "../../stepper/python/directives";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCaretDown} from '@fortawesome/free-solid-svg-icons/faCaretDown';
import {useResizeDetector} from 'react-resize-detector';

interface ZoneLayoutProps {
    name: string,
    metadata: LayoutElementMetadata,
    directives?: Directive[],
    children: React.ReactNode,
}

export function ZoneLayout(props: ZoneLayoutProps) {
    const {metadata} = props;
    const [isBottom, setIsBottom] = useState(true);
    const zoneLayoutRef = useRef<HTMLDivElement>(null);
    const hasDesiredSize = !!metadata.desiredSize;
    const style: React.CSSProperties = hasDesiredSize ? {flexBasis: metadata.desiredSize} : {flex: '1 0'};
    const zoneStyle: React.CSSProperties = {};
    if (false !== metadata.overflow) {
        zoneStyle.overflow = 'auto';
    }

    const scrollZoneLayout = useCallback(() => {
        const el = zoneLayoutRef.current;
        const isBottom = el.scrollHeight - el.scrollTop === el.clientHeight;
        setIsBottom(isBottom);
    }, []);

    const {} = useResizeDetector({
        handleHeight: false,
        refreshMode: 'debounce',
        refreshRate: 100,
        targetRef: zoneLayoutRef,
        onResize: scrollZoneLayout,
    });

    return (
        <div className={`zone-layout-wrapper ${'show-scroll' === metadata.overflow && !isBottom && 'show-scroll'}`} style={style}>
            <div className="zone-layout" style={zoneStyle} ref={zoneLayoutRef} onScroll={scrollZoneLayout}>
                {props.children}
            </div>
            {'show-scroll' === metadata.overflow && <div className={`zone-layout-scroll-icon ${isBottom ? 'is-bottom' : ''}`}>
                <FontAwesomeIcon icon={faCaretDown}/>
            </div>}
        </div>
    );
}
