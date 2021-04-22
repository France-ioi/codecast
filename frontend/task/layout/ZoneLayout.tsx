import React, {ReactElement} from 'react';
import {MultiVisualization} from "../MultiVisualization";
import {AppStore} from "../../store";
import {connect} from "react-redux";
import {LayoutElementMetadata, LayoutVisualization} from "./layout";

function mapStateToProps(state: AppStore) {
    return {
        preferredVisualizations: state.layout.preferredVisualizations,
        getMessage: state.getMessage,
    };
}

interface ZoneLayoutStateToProps {
    preferredVisualizations: string[],
    getMessage: Function,
}

interface ZoneLayoutProps extends ZoneLayoutStateToProps {
    name: string,
    metadata: LayoutElementMetadata,
}

class _ZoneLayout extends React.PureComponent<ZoneLayoutProps> {
    render() {
        const children = React.Children.toArray(this.props.children);
        if (!children.length) {
            return null;
        }

        let visualizationCount = 0;
        const visualizations = children.map(child => {
            visualizationCount++;

            const defaultMetadata = {
                id: "visualization-" + visualizationCount,
                title: this.props.getMessage('TASK_VISUALIZATION').format({number: visualizationCount}),
                icon: null,
            };

            return {
                metadata: {...defaultMetadata, ...(child as ReactElement).props.metadata} as LayoutElementMetadata,
                element: child,
            } as LayoutVisualization;
        });

        if (!visualizations.length) {
            return null;
        }

        let currentVisualization = visualizations[0];
        if (visualizations.length > 1) {
            let visualizationsRankPreference = visualizations
                .map(({metadata: {id}}) => ({id, rank: this.props.preferredVisualizations.indexOf(id)}))
                .filter(({rank}) => -1 !== rank);

            if (visualizationsRankPreference.length) {
                visualizationsRankPreference.sort(({rank: rank1}, {rank: rank2}) => rank2 - rank1);
                const preferredVisualizationId = visualizationsRankPreference[0].id;
                currentVisualization = visualizations.find(({metadata: {id}}) => id === preferredVisualizationId);
            }
        }

        const {metadata, element} = currentVisualization;
        const hasDesiredSize = !!metadata.desiredSize;
        const style: React.CSSProperties = hasDesiredSize ? {flexBasis: metadata.desiredSize} : {flex: '1 0'};
        if (false !== metadata.overflow) {
            style.overflow = 'auto';
        }

        if (visualizations.length > 1) {
            return (
                <div className="zone-layout" style={style}>
                    <MultiVisualization
                        className="visualization-container"
                        visualizations={visualizations}
                        currentVisualization={currentVisualization}
                    />
                </div>
            );
        } else {
            return (
                <div className="zone-layout" style={style}>
                    {element}
                </div>
            );
        }
    }
}

export const ZoneLayout = connect(mapStateToProps)(_ZoneLayout);

