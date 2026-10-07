import React, {ReactElement} from 'react';
import {useDispatch} from "react-redux";
import {Icon} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";

interface MultiVisualizationProps {
    className?: string,
    currentVisualizationGroup: number,
    children: React.ReactNode,
}

export function MultiVisualization(props: MultiVisualizationProps) {
    const dispatch = useDispatch();
    const elements = React.Children.toArray(props.children) as ReactElement<{metadata: any}>[];
    const currentElement = elements[props.currentVisualizationGroup];

    const selectVisualization = (id: string) => {
        dispatch({type: ActionTypes.LayoutVisualizationSelected, payload: {visualization: id}});
    };

    return (
        <div className={`multi-visualization ${props.className ? props.className : ''}`}>
            <div className="multi-visualization-pills">
                {elements.map((element) => {
                    const {metadata} = element.props;
                    const isActive = element === currentElement;

                    return (
                        <button
                            key={metadata.id}
                            type="button"
                            className={`multi-visualization-pill ${isActive ? 'is-active' : ''}`}
                            onClick={() => selectVisualization(metadata.id)}
                        >
                            {metadata.icon && <Icon icon={metadata.icon as React.JSX.Element}/>}
                            <span>{metadata.title}</span>
                        </button>
                    );
                })}
            </div>

            <div className="multi-visualization-content">
                {currentElement}
            </div>
        </div>
    );
}
