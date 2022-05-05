import * as React from 'react';
import {AnalysisVariable} from "./AnalysisVariable";
import {useDispatch} from "react-redux";
import {CodecastAnalysisVariable} from "./analysis";
import {analysisTogglePath} from "./analysis_slice";
import {useAppSelector} from "../../hooks";

interface AnalysisVariableValueProps {
    variable: CodecastAnalysisVariable,
    stackFrameId: number,
}

const collapsedTypes = ['list', 'tuple', 'range', 'set', 'frozenset', 'Array'];

export const AnalysisVariableValue = (props: AnalysisVariableValueProps) => {
    const variable = props.variable;

    let isOpen = useAppSelector(state => props.stackFrameId in state.analysis.openedPaths && -1 !== state.analysis.openedPaths[props.stackFrameId].indexOf(props.variable.path));
    if (collapsedTypes.indexOf(variable.type) !== -1) {
        isOpen = true;
    }

    const dispatch = useDispatch();
    const toggleOpened = () => {
        dispatch(analysisTogglePath({stackFrameId: props.stackFrameId, path: props.variable.path}));
    };

    if (variable.alreadyVisited) {
        return (
            <React.Fragment>
                <span className="object-toggle" onClick={toggleOpened}>
                    <span className="toggle-icon">▾</span>
                </span>
                <span>...</span>
            </React.Fragment>
        )
    }

    if (Array.isArray(variable.variables)) {
        const isCollapsed = -1 !== collapsedTypes.indexOf(variable.type);

        let renderedElements;
        if (isCollapsed) {
            let delimiters = -1 !== ['set', 'frozenset'].indexOf(variable.type) ? '{}' : '[]';
            renderedElements = (<React.Fragment>
                {delimiters[0]}{variable.variables.map((innerVariable, index) => {
                    return (
                        <span key={innerVariable.name}>
                            <AnalysisVariableValue
                                variable={innerVariable}
                                stackFrameId={props.stackFrameId}
                            />
                            {(index + 1) < variable.variables.length ? ', ' : null}
                        </span>
                    );
                })}{delimiters[1]}
            </React.Fragment>);
        } else {
            renderedElements = (<ul className="object_scope">
                {variable.variables.length ? variable.variables.map((innerVariable) => {
                    return (
                        <li key={innerVariable.name}>
                            <AnalysisVariable
                                variable={innerVariable}
                                stackFrameId={props.stackFrameId}
                            />
                        </li>
                    );
                }) : (
                    <li>
                        <span className="value-empty">&lt;&gt;</span>
                    </li>
                )}
            </ul>);
        }

        return (
            <React.Fragment>
                {isOpen ? (
                    <React.Fragment>
                        <span className={isCollapsed ? "list-toggle list-toggle-open" : "object-toggle object-toggle-open"} onClick={toggleOpened}>
                            <span className="toggle-icon">▾</span>
                        </span>
                        {renderedElements}
                    </React.Fragment>
                ) : (
                    <span className={isCollapsed ? "list-toggle" : "object-toggle"} onClick={toggleOpened}>
                        <span className="toggle-icon">▸</span>
                        <span className={isCollapsed ? "value-list-closed" : "value-object-closed"}>
                            &lt;{variable.type}&gt;
                        </span>
                    </span>
                )}
            </React.Fragment>
        )
    }

    let classes = 'value-scalar';
    if (variable.loaded) {
        classes += ' value-loaded';
    }

    return (
        <React.Fragment>
            <span className={classes}>{variable.value}</span>
            {null !== variable.previousValue && variable.value !== variable.previousValue ?
                <span className="value-previous">{variable.previousValue}</span>
                : null}
        </React.Fragment>
    );
}
