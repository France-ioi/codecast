import React from 'react';
import {LayoutElementMetadata} from "./layout";
import {Directive} from "../../stepper/python/directives";

interface ZoneLayoutProps {
    name: string,
    metadata: LayoutElementMetadata,
    directives?: Directive[],
    children: React.ReactNode,
}

export function ZoneLayout(props: ZoneLayoutProps) {
    const {metadata} = props;
    const hasDesiredSize = !!metadata.desiredSize;
    const style: React.CSSProperties = hasDesiredSize ? {flexBasis: metadata.desiredSize} : {flex: '1 0'};
    if (false !== metadata.overflow) {
        style.overflow = 'auto';
    }

    return (
        <div className="zone-layout" style={style}>
            {props.children}
        </div>
    );
}
