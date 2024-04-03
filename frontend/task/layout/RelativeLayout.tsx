import React from 'react';
import {LayoutElementMetadata} from "./layout";

export enum RelativeLayoutOrientation {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
}

interface RelativeLayoutProps {
    orientation: RelativeLayoutOrientation,
    metadata: LayoutElementMetadata,
    children: React.ReactNode,
}

export class RelativeLayout extends React.PureComponent<RelativeLayoutProps> {
    render() {
        const childrenRendered = (
            <React.Fragment>
                {this.props.children}
            </React.Fragment>
        );

        const style: React.CSSProperties = this.props.metadata.desiredSize ? {flexBasis: this.props.metadata.desiredSize} : {flex: '1 0'};

        return (
            <div className={`relative-layout is-${this.props.orientation}`} style={style}>
                {childrenRendered}
            </div>
        );
    }
}
