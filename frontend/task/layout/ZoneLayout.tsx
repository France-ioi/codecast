import React, {ReactElement} from 'react';
import {MultiVisualization} from "../MultiVisualization";
import {AppStore} from "../../store";
import {connect} from "react-redux";
import {LayoutElementMetadata, LayoutVisualization} from "./layout";
import {Directive} from "../../stepper/python/directives";
import {DirectivePanel} from "../../stepper/views/DirectivePanel";
import {StepperState} from "../../stepper";

function mapStateToProps(state: AppStore) {
    return {
        currentStepperState: state.stepper ? state.stepper.currentStepperState : null,
        preferredVisualizations: state.layout.preferredVisualizations,
        getMessage: state.getMessage,
    };
}

interface ZoneLayoutStateToProps {
    preferredVisualizations: string[],
    getMessage: Function,
    currentStepperState: StepperState,
}

interface ZoneLayoutProps extends ZoneLayoutStateToProps {
    name: string,
    metadata: LayoutElementMetadata,
    directives?: Directive[],
}

class _ZoneLayout extends React.PureComponent<ZoneLayoutProps> {
    render() {
        const children = React.Children.toArray(this.props.children);

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

        if (this.props.directives && this.props.directives.length && this.props.currentStepperState) {
            const {analysis, programState, lastProgramState, controls, directives, platform} = this.props.currentStepperState;
            const {functionCallStackMap} = directives;
            const context = {analysis, programState, lastProgramState};

            const directivesByGroup: {[key: string]: Directive[]} = {};
            for (let directive of this.props.directives) {
                const {byName} = directive;
                const directiveGroup = byName['group'] ?? 'default';
                if (!(directiveGroup in directivesByGroup)) {
                    directivesByGroup[directiveGroup] = [];
                }
                directivesByGroup[directiveGroup].push(directive);
            }

            for (let directives of Object.values(directivesByGroup)) {
                visualizationCount++;
                visualizations.push({
                    metadata: {
                        id: "visualization-" + visualizationCount,
                        title: this.props.getMessage('TASK_VISUALIZATION').format({number: visualizationCount}),
                        icon: null,
                    },
                    element: (
                        <div className="directives-container">
                            {directives.map(directive => {
                                const {key} = directive;
                                const dirControls = (controls.hasOwnProperty(key)) ? controls[key] : {};
                                let functionCallStack = null;
                                if (platform === 'unix' || platform === 'arduino') {
                                    functionCallStack = functionCallStackMap[key];
                                }

                                return (
                                    <DirectivePanel
                                        key={key}
                                        directive={directive}
                                        controls={dirControls}
                                        scale={1}
                                        context={context}
                                        functionCallStack={functionCallStack}
                                        platform={platform}
                                        getMessage={this.props.getMessage}
                                        onChange={() => {}}
                                    />
                                );
                            })}
                        </div>
                    )
                });
            }
        }

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

