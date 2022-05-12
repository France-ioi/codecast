import * as React from 'react';
import {useDispatch} from "react-redux";
import {CodecastAnalysisVariable} from "./analysis";
import {analysisTogglePath} from "./analysis_slice";
import {useAppSelector} from "../../hooks";

interface AnalysisVariableProps {
    variable: CodecastAnalysisVariable,
    stackFrameId: number,
    displayMaxLength?: number,
    recursionLevel?: number,
    onlyValue?: boolean,
}

const collapsedTypes = ['list', 'tuple', 'range', 'set', 'frozenset', 'Array'];

export const AnalysisVariable = (props: AnalysisVariableProps) => {
    const variable = props.variable;

    let isOpen = useAppSelector(state => props.stackFrameId in state.analysis.openedPaths && -1 !== state.analysis.openedPaths[props.stackFrameId].indexOf(props.variable.path));
    let isParentOpen = useAppSelector(state => props.stackFrameId in state.analysis.openedPaths && -1 !== state.analysis.openedPaths[props.stackFrameId].indexOf(props.variable.path.split('.').slice(0, -1).join('.')));

    const dispatch = useDispatch();
    const toggleOpened = (e) => {
        e.stopPropagation();
        dispatch(analysisTogglePath({stackFrameId: props.stackFrameId, path: props.variable.path}));
    };

    // if (variable.alreadyVisited) {
    //     return (
    //         <React.Fragment>
    //             <span className="object-toggle" onClick={toggleOpened}>
    //                 <span className="toggle-icon">▾</span>
    //             </span>
    //             <span>...</span>
    //         </React.Fragment>
    //     )
    // }

    const isCollapsed = -1 !== collapsedTypes.indexOf(variable.type);

    const getVariableValue = () => {
        if ((isParentOpen && props.recursionLevel > 10) || (!isParentOpen && props.recursionLevel > 2)) {
            return <span>...</span>;
        }

        if (Array.isArray(variable.variables)) {
            let renderedElements;
            let askedDisplayedMaxLength = props.displayMaxLength ? props.displayMaxLength : 50;
            const elementsToDisplay = Math.min(
                variable.variables.length,
                isOpen ? (isCollapsed ? 100 : 20) : Math.floor(askedDisplayedMaxLength / (isCollapsed ? 4 : 15))
            );
            const displayMaxLength = (isOpen ? 1000 : askedDisplayedMaxLength) / elementsToDisplay;
            console.log('element to display', {isOpen, isCollapsed, elementsToDisplay, displayMaxLength, askedDisplayedMaxLength});
            if (isCollapsed || !isOpen) {
                let delimiters = -1 !== ['set', 'frozenset'].indexOf(variable.type) || !isCollapsed ? '{}' : '[]';
                renderedElements = (<React.Fragment>
                    {delimiters[0]}{variable.variables.slice(0, elementsToDisplay).map((innerVariable, index) => {
                    return (
                        <span key={innerVariable.name}>
                            <AnalysisVariable
                                variable={innerVariable}
                                stackFrameId={props.stackFrameId}
                                onlyValue={isCollapsed}
                                displayMaxLength={displayMaxLength}
                                recursionLevel={(props.recursionLevel ? props.recursionLevel : 0) + 1}
                            />
                            {(index + 1) < variable.variables.length ? ', ' : null}
                        </span>
                    );
                })}{variable.variables.length > elementsToDisplay ? '...' : ''}{delimiters[1]}
                </React.Fragment>);
            } else {
                renderedElements = (<ul className="object_scope">
                    {variable.variables.length ? variable.variables.slice(0, elementsToDisplay).map((innerVariable) => {
                        return (
                            <li key={innerVariable.name}>
                                <AnalysisVariable
                                    variable={innerVariable}
                                    displayMaxLength={displayMaxLength}
                                    stackFrameId={props.stackFrameId}
                                    recursionLevel={(props.recursionLevel ? props.recursionLevel : 0) + 1}
                                />
                            </li>
                        );
                    }) : (
                        <li>
                            <span className="value-empty">&lt;&gt;</span>
                        </li>
                    )}
                    {variable.variables.length > elementsToDisplay ? <li>...</li> : null}
                </ul>);
            }

            return (
                <span onClick={toggleOpened}>
                    <span className={isCollapsed ? `list-toggle ${isOpen ? 'list-toggle-open' : ''}` : `object-toggle ${isOpen ? 'object-toggle-open' : ''}`}>
                        <span className="toggle-icon">{isOpen ? '▾' : '▸'}</span>
                    </span>
                    <span className="value-type">
                        &lt;{variable.type}&gt;
                    </span>
                    {isCollapsed ? <span className="value-count"> {`(${variable.variables.length})`}</span> : ''}
                    {elementsToDisplay > 0 && <span>&nbsp;{renderedElements}</span>}
                </span>
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

    const variableValue = getVariableValue();

    console.log('only value', props.onlyValue);

    if (props.onlyValue) {
        return variableValue;
    }

    if (!isCollapsed && props.displayMaxLength && props.displayMaxLength - 3 < variable.name.length) {
        return <span>...</span>;
    }

    return (
        <span className="variable-container">
            <span>
                <span className="variable-name">{variable.name}</span>
            </span>
            {' = '}
            <span className="vardecl-value">
                <span className="value">
                    {variableValue}
                </span>
            </span>
        </span>
    );
}
