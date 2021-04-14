import React from 'react';
import {connect} from "react-redux";
import {Dropdown} from 'react-bootstrap';
import {Icon} from "@blueprintjs/core";
import {IconName} from "@blueprintjs/icons";

function mapStateToProps() {

}

interface MultiVisualizationDispatchToProps {
    dispatch: Function
}

interface MultiVisualizationProps extends MultiVisualizationDispatchToProps {
    children: React.ReactElement<{'data-title': string, 'data-id': string, 'data-icon'?: string}, any>[],
    className?: string,
    advisedVisualization?: string,
}

interface MultiVisualizationState {
    currentVisualization: string,
}

const CustomToggle = React.forwardRef<HTMLAnchorElement, {onClick: Function}>(({children, onClick}, ref) => (
    <a
        href=""
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        className="multi-visualization-toggle"
    >
        {children}
        <span className="multi-visualization-toggle-caret">&#x25bc;</span>
    </a>
));

class _MultiVisualization extends React.PureComponent<MultiVisualizationProps, MultiVisualizationState> {
    state = {
        currentVisualization: null,
    };

    componentDidUpdate(prevProps) {
        if (prevProps.advisedVisualization !== this.props.advisedVisualization && this.props.advisedVisualization) {
            this.setState({
                currentVisualization: this.props.advisedVisualization,
            })
        }
    }

    render() {
        const visualizations = React.Children.map(this.props.children, child => {
            return {
                id: child.props['data-id'],
                title: child.props['data-title'],
                icon: child.props['data-icon'],
                element: child,
            };
        });

        if (!visualizations) {
            return null;
        }

        let currentVisualization = visualizations.find(visualization => (this.state.currentVisualization ?? this.props.advisedVisualization) === visualization.id);
        if (!currentVisualization) {
            currentVisualization = visualizations[0];
        }

        return (
            <div className={`multi-visualization ${this.props.className}`}>
                <Dropdown>
                    <Dropdown.Toggle as={CustomToggle}>{currentVisualization.title}</Dropdown.Toggle>

                    <Dropdown.Menu>
                        {visualizations.map(visualization =>
                            <Dropdown.Item onClick={() => this.selectVisualization(visualization.id)}>
                                {visualization.icon && <Icon icon={visualization.icon as IconName}/>}
                                <span>{visualization.title}</span>
                            </Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                </Dropdown>

                <div className="multi-visualization-content">
                    {currentVisualization.element}
                </div>
            </div>
        );
    }

    selectVisualization = (id: string) => {
        this.setState({
            currentVisualization: id,
        });
    };
}

export const MultiVisualization = connect(mapStateToProps)(_MultiVisualization);
