import React, {ReactElement} from 'react';
import {MultiVisualization} from "../MultiVisualization";

interface ZoneLayoutProps {
    name: string,
}

export class ZoneLayout extends React.PureComponent<ZoneLayoutProps> {
    render() {
        const children = React.Children.toArray(this.props.children);
        if (!children.length) {
            return null;
        }

        const elements = children.map(child => {
            return {
                metadata: (child as ReactElement).props.metadata ?? {},
                element: child,
            };
        });

        if (elements.length > 1) {
            return (
                <div className="zone-layout">
                    <MultiVisualization className="visualization-container" advisedVisualization={null}>
                        {elements.map(({metadata, element}) =>
                            <div key={metadata.id} data-title={metadata.title} data-id={metadata.id} data-icon={metadata.icon}>
                                {element}
                            </div>
                        )}
                    </MultiVisualization>
                </div>
            );
        } else {
            const {metadata, element} = elements[0];
            const hasDesiredSize = !!metadata.desiredSize;
            const style: React.CSSProperties = hasDesiredSize ? {flexBasis: metadata.desiredSize} : {flex: '1 0'};
            if (false !== metadata.overflow) {
                style.overflow = 'auto';
            }

            return (
                <div className="zone-layout" style={style}>
                    {element}
                </div>
            );
        }
    }
}
