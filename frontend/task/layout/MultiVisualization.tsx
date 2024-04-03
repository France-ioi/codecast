import React, {ReactElement, ReactNode} from 'react';
import {connect} from "react-redux";
import {Dropdown} from 'react-bootstrap';
import {Icon} from "@blueprintjs/core";
import {IconName} from "@blueprintjs/icons";
import {ActionTypes} from "./actionTypes";

function mapStateToProps() {
    return {};
}

interface MultiVisualizationDispatchToProps {
    dispatch: Function
}

interface MultiVisualizationProps extends MultiVisualizationDispatchToProps {
    className?: string,
    currentVisualizationGroup: number,
    children: React.ReactNode,
}

const _CustomToggle = ({children, onClick}, ref) => (
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
);

const CustomToggle = React.forwardRef<HTMLAnchorElement, {children: ReactNode, onClick: Function}>(_CustomToggle);

class _MultiVisualization extends React.PureComponent<MultiVisualizationProps> {
    render() {
        const elements: ReactElement[] = React.Children.toArray(this.props.children) as ReactElement[];

        return (
            <div className={`multi-visualization ${this.props.className ? this.props.className : ''}`}>
                <Dropdown>
                    <Dropdown.Toggle as={CustomToggle}>{this.props.children[this.props.currentVisualizationGroup].props.metadata.title}</Dropdown.Toggle>

                    <Dropdown.Menu>
                        {elements.map(({props: {metadata}}) =>
                            <Dropdown.Item key={metadata.id} onClick={() => this.selectVisualization(metadata.id)}>
                                {metadata.icon && <Icon icon={metadata.icon as IconName}/>}
                                <span>{metadata.title}</span>
                            </Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                </Dropdown>

                <div className="multi-visualization-content">
                    {this.props.children[this.props.currentVisualizationGroup]}
                </div>
            </div>
        );
    }

    selectVisualization = (id: string) => {
        this.props.dispatch({type: ActionTypes.LayoutVisualizationSelected, payload: {visualization: id}})
    };
}

export const MultiVisualization = connect(mapStateToProps)(_MultiVisualization);
