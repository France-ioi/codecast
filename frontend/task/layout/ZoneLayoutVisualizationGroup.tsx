import React from 'react';
import {LayoutElementMetadata} from "./layout";

interface VisualizationGroupProps {
    metadata: LayoutElementMetadata,
}

// A group in which we can have one or more visualizations that share the same zome in the layout
// We give them the dimensions they require, and flex wrap them so that they take the minimal space
export class ZoneLayoutVisualizationGroup extends React.PureComponent<VisualizationGroupProps> {
    render() {
        const stackingOrientation = this.props.metadata.stackingOrientation ? 'is-' + this.props.metadata.stackingOrientation : '';

        return (
            <div className={`visualization-group ${stackingOrientation}`}>
                {this.props.children}
            </div>
        );
    }
}
