import * as React from 'react';
import {useDispatch} from "react-redux";
import {CodecastAnalysisVariable} from "./analysis";
import {analysisTogglePath} from "./analysis_slice";
import {useAppSelector} from "../../hooks";
import {AnalysisVariableImage} from './AnalysisVariableImage';

interface AnalysisVariableProps {
    variable: CodecastAnalysisVariable,
    stackFrameId: number,
    displayMaxLength?: number,
    recursionLevel?: number,
    onlyValue?: boolean,
}

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

    const isCollapsed = variable.collapsed;

    const getVariableValue = () => {
        const isScalar = !Array.isArray(variable.variables);

        if (((isParentOpen && props.recursionLevel > 10) || (!isParentOpen && props.recursionLevel > 2)) && (!isScalar || String(variable.value).length > 4)) {
            return <span>...</span>;
        }

        if (Array.isArray(variable.variables)) {
            let renderedElements;
            let askedDisplayedMaxLength = props.displayMaxLength ?? 50;
            const elementsToDisplay = Math.min(
                variable.variables.length,
                isOpen ? (isCollapsed ? 100 : 20) : Math.floor(askedDisplayedMaxLength / (isCollapsed ? 4 : 15))
            );
            const displayMaxLength = (isOpen ? 1000 : askedDisplayedMaxLength) / elementsToDisplay;
            if (isCollapsed || !isOpen) {
                let delimiters = variable.withCurlyBraces || !isCollapsed ? '{}' : '[]';
                renderedElements = (<React.Fragment>
                    {delimiters[0]}{variable.variables.slice(0, elementsToDisplay).map((innerVariable, index) => {
                        return (
                            <span key={innerVariable.name}>
                                <AnalysisVariable
                                    variable={innerVariable}
                                    stackFrameId={props.stackFrameId}
                                    onlyValue={isCollapsed}
                                    displayMaxLength={displayMaxLength}
                                    recursionLevel={(props.recursionLevel ?? 0) + 1}
                                />
                                {(index + 1) < variable.variables.length ? ', ' : null}
                            </span>
                        );
                    })}{variable.variables.length > elementsToDisplay ? '...' : ''}{delimiters[1]}
                </React.Fragment>);
            } else {
                renderedElements = (<ul className="object-scope">
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
                    {!isCollapsed && <span className="value-type">
                        &lt;{variable.type}&gt;
                    </span>}
                    {isCollapsed ? <span className="value-count">{`(${variable.variables.length})`}</span> : ''}
                    {elementsToDisplay > 0 && <span>&nbsp;{renderedElements}</span>}
                </span>
            );
        }

        const hasPreviousValue = null !== variable.previousValue && undefined !== variable.previousValue && variable.value !== variable.previousValue;

        const truncateValue = (value, maxLength) => {
            if ('string' === typeof value && 'image' === value.replace(/"/g, '').split(':')[0]) {
                return <AnalysisVariableImage
                    imageUrl={value.replace(/"/g, '').split(':')[1]}
                />;
            }
            if ('string' === typeof value && value.substring(0, 1) === '"' && value.length > maxLength) {
                return value.substring(0, maxLength - 3) + '..."';
            }

            return value;
        }

        return (
            <React.Fragment>
                <span className={`value-scalar ${hasPreviousValue ? 'value-has-changed' : ''} ${!hasPreviousValue && variable.loaded ? 'value-loaded' : ''}`}>
                    {truncateValue(variable.value, props.displayMaxLength)}
                    {variable.displayType && <span className="value-type ml-1">
                        &lt;{variable.type}&gt;
                    </span>}
                </span>
                {hasPreviousValue ?
                    <span className={`value-previous ${variable.loaded ? 'value-loaded' : ''}`}>{truncateValue(variable.previousValue, props.displayMaxLength)}</span>
                    : null}
            </React.Fragment>
        );
    }

    const variableValue = getVariableValue();

    if (props.onlyValue) {
        return variableValue;
    }

    // if (!isCollapsed && props.displayMaxLength && props.displayMaxLength - 3 < variable.name.length) {
    //     return <span>...</span>;
    // }

    return (
        <span className="variable-container">
            <span>
                <span className="variable-name" title={variable.address}>{variable.name}</span>
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
