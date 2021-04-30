import React from 'react';
import {LayoutElementMetadata} from "./layout";
import {Directive} from "../../stepper/python/directives";

interface ZoneLayoutProps {
    name: string,
    metadata: LayoutElementMetadata,
    directives?: Directive[],
}

export class ZoneLayout extends React.PureComponent<ZoneLayoutProps> {
    render() {
        const {metadata} = this.props;
        const hasDesiredSize = !!metadata.desiredSize;
        const style: React.CSSProperties = hasDesiredSize ? {flexBasis: metadata.desiredSize + 'px'} : {flex: '1 0'};
        if (false !== metadata.overflow) {
            style.overflow = 'auto';
        }

        return (
            <div className="zone-layout" style={style}>
                {this.props.children}
            </div>
        );
    }
}
