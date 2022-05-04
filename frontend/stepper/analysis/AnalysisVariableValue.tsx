import * as React from 'react';
import {AnalysisVariable} from "./AnalysisVariable";
import {useDispatch} from "react-redux";
import {CodecastAnalysisVariable} from "./index";
import {analysisTogglePath} from "./analysis_slice";
import {useAppSelector} from "../../hooks";

interface AnalysisVariableValueProps {
    variable: CodecastAnalysisVariable,
    defaultopened?: boolean,
    stackFrameId: number,
}

export const AnalysisVariableValue = (props: AnalysisVariableValueProps) => {
    const variable = props.variable;

    let isOpen = useAppSelector(state => props.stackFrameId in state.analysis.openedPaths && -1 !== state.analysis.openedPaths[props.stackFrameId].indexOf(props.variable.path));
    if (['list', 'tuple', 'range', 'set', 'frozenset'].indexOf(variable.type) !== -1) {
        isOpen = true;
    }

    const dispatch = useDispatch();
    const toggleOpened = () => {
        dispatch(analysisTogglePath({stackFrameId: props.stackFrameId, path: props.variable.path}));
    };

    // if (this.props.cur instanceof Sk.builtin.dict) {
    //     const elements = [];
    //     let isEmpty = true;
    //     const entries = Object.entries(this.props.cur.entries);
    //     for (let i in entries) {
    //         const key = entries[i][0];
    //         const item = entries[i][1];
    //
    //         // Ignore the element with name __dict__ that appears in objects dictionnaries.
    //         if (key === '__dict__') {
    //             continue;
    //         }
    //
    //         let old = undefined;
    //         if (this.props.old && this.props.old instanceof Sk.builtin.dict) {
    //             const oldEntry = Object.entries(this.props.old.entries)[i];
    //             if (oldEntry) {
    //                 old = oldEntry[1][1];
    //             }
    //         }
    //
    //         const path = this.props.path + ':' + key;
    //         const loaded = this.props.loadedReferences.hasOwnProperty(this.props.cur._uuid + '_' + key);
    //
    //         elements.push({
    //             name: key,
    //             value: {
    //                 cur: item[1],
    //                 old: old
    //             },
    //             path: path,
    //             loaded: loaded
    //         });
    //         isEmpty = false;
    //     }
    //
    //     const wasVisited = this.props.visited[this.props.cur._uuid];
    //     const visited = {
    //         ...this.props.visited,
    //
    //     }
    //     visited[this.props.cur._uuid] = true;
    //
    //     let renderedElements;
    //     if (wasVisited) {
    //         renderedElements = '...';
    //     } else if (isEmpty) {
    //         renderedElements = <span className="value-empty">&lt;&gt;</span>;
    //     } else {
    //         renderedElements = elements.map((element) => {
    //             let loadedReferences = {};
    //             if (element.loaded) {
    //                 loadedReferences = this.props.loadedReferences;
    //             }
    //
    //             return (
    //                 <li key={element.name}>
    //                     <AnalysisVariable
    //                         variable={element.variable}
    //                         visited={visited}
    //                         path={element.path}
    //                         loadedReferences={loadedReferences}
    //                         openedPaths={this.props.openedPaths}
    //                         scopeIndex={this.props.scopeIndex}
    //                     />
    //                 </li>
    //             );
    //         });
    //     }
    //
    //     return (
    //         <React.Fragment>
    //             {this.isOpened() ? (
    //                 <React.Fragment>
    //                     <span className="object-toggle object-toggle-open" onClick={this.toggleOpened}>
    //                         <span className="toggle-icon">▾</span>
    //                     </span>
    //                     <ul className="object_scope">
    //                         {renderedElements}
    //                     </ul>
    //                 </React.Fragment>
    //             ) : (
    //                 <span className="object-toggle" onClick={this.toggleOpened}>
    //                     <span className="toggle-icon">▸</span>
    //                     <span className="value-object-closed">
    //                         &lt;dict&gt;
    //                     </span>
    //                 </span>
    //             )}
    //         </React.Fragment>
    //     )
    // }
    //
    // if (this.props.cur.value instanceof Sk.builtin.set || this.props.cur.value instanceof Sk.builtin.frozenset) {
    //     const elements = [];
    //     let isEmpty = true;
    //     const entries = Object.entries(this.props.cur.v.entries);
    //     for (let i in entries) {
    //         const key = entries[i][0];
    //
    //         // Ignore the element with name __dict__ that appears in objects dictionnaries.
    //         if (key === '__dict__') {
    //             continue;
    //         }
    //
    //         let old = undefined;
    //         if (this.props.old && this.props.old.v instanceof Sk.builtin.dict) {
    //             const oldEntry = this.props.old.v.entries[i];
    //             if (oldEntry) {
    //                 old = oldEntry[1][0];
    //             }
    //         }
    //
    //         const path = this.props.path + ':' + key;
    //         const loaded = this.props.loadedReferences.hasOwnProperty(this.props.cur.v._uuid + '_' + key);
    //
    //         elements.push({
    //             name: key,
    //             value: {
    //                 cur: entries[i][1][0],
    //                 old: old
    //             },
    //             path: path,
    //             loaded: loaded
    //         });
    //         isEmpty = false;
    //     }
    //
    //     const wasVisited = this.props.visited[this.props.cur.v._uuid];
    //     const visited = {
    //         ...this.props.visited,
    //
    //     }
    //     visited[this.props.cur.v._uuid] = true;
    //
    //     let renderedElements;
    //     if (wasVisited) {
    //         renderedElements = '...';
    //     } else if (isEmpty) {
    //         renderedElements = <span className="value-empty">&lt;&gt;</span>;
    //     } else {
    //         renderedElements = elements.map((element, index) => {
    //             let loadedReferences = {};
    //             if (element.loaded) {
    //                 loadedReferences = this.props.loadedReferences;
    //             }
    //
    //             return (
    //                 <span key={element.name}>
    //                     <AnalysisVariableValue
    //                         cur={element.value.cur}
    //                         old={element.value.old}
    //                         visited={visited}
    //                         path={element.path}
    //                         loadedReferences={loadedReferences}
    //                         openedPaths={this.props.openedPaths}
    //                         scopeIndex={this.props.scopeIndex}
    //                     />
    //                     {(index + 1) < elements.length ? ', ' : null}
    //                 </span>
    //             );
    //         });
    //     }
    //
    //     return (
    //         <React.Fragment>
    //             {this.isOpened() ? (
    //                 <React.Fragment>
    //                     <span className="list-toggle list-toggle-open" onClick={this.toggleOpened}>
    //                         <span className="toggle-icon">▾</span>
    //                     </span>
    //                     &#x7B;{renderedElements}&#x7D;
    //                 </React.Fragment>
    //             ) : (
    //                 <span className="list-toggle" onClick={this.toggleOpened}>
    //                     <span className="toggle-icon">▸</span>
    //                     <span className="value-list-closed">
    //                         &lt;{this.props.cur instanceof Sk.builtin.frozenset ? 'frozenset' : 'set'}&gt;
    //                     </span>
    //                 </span>
    //             )}
    //         </React.Fragment>
    //     )
    // }

    if (variable.alreadyVisited) {
        return (
            <React.Fragment>
                <span className="object-toggle object-toggle-open" onClick={toggleOpened}>
                    <span className="toggle-icon">▾</span>
                </span>
                <ul className="object_scope">
                    <li>...</li>
                </ul>
            </React.Fragment>
        )
    }

    // if (this.props.cur instanceof Sk.builtin.list || this.props.cur instanceof Sk.builtin.tuple || this.props.cur instanceof Sk.builtin.range_) {
    //
    //     let renderedElements;
    //     if (wasVisited) {
    //         renderedElements = '...';
    //     } else {
    //         renderedElements =
    //     }
    //
    //     return (
    //         <React.Fragment>
    //             {this.isOpened() ? (
    //                 <React.Fragment>
    //                         <span className="list-toggle list-toggle-open" onClick={this.toggleOpened}>
    //                             <span className="toggle-icon">▾</span>
    //                         </span>
    //                     [{renderedElements}]
    //                 </React.Fragment>
    //             ) : (
    //                 <span className="list-toggle" onClick={this.toggleOpened}>
    //                         <span className="toggle-icon">▸</span>
    //                         <span className="value-list-closed">
    //                             &lt;{variableType}&gt;
    //                         </span>
    //                     </span>
    //             )}
    //         </React.Fragment>
    //     )
    // }

    if (Array.isArray(variable.variables)) {
        const isCollapsed = -1 !== ['list', 'tuple', 'range', 'set', 'frozenset'].indexOf(variable.type);

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

    // if (this.props.cur instanceof Sk.builtin.object && this.props.cur.hasOwnProperty('$d')) {
    //     /**
    //      * An object's representation is as follow :
    //      *
    //      * test : Sk.builtin.object
    //      *   - $d : Sk.builtin.dict
    //      */
    //
    //     console.log('object => ', this.props);
    //
    //     let old = this.props.old;
    //     if (old && old instanceof Sk.builtin.object) {
    //         old = old.$d;
    //     }
    //
    //     const wasVisited = this.props.visited[this.props.cur._uuid];
    //     const visited = {
    //         ...this.props.visited,
    //
    //     }
    //     visited[this.props.cur._uuid] = true;
    //
    //     let loadedReferences = {};
    //     if (isLoaded(this.props.loadedReferences, this.props)) {
    //         loadedReferences = this.props.loadedReferences;
    //     }
    //
    //     return (
    //         <React.Fragment>
    //             {wasVisited ? '...' : (
    //                 <AnalysisVariableValue
    //                     cur={this.props.cur.$d}
    //                     old={old}
    //                     visited={visited}
    //                     path={this.props.path}
    //                     loadedReferences={loadedReferences}
    //                     openedPaths={this.props.openedPaths}
    //                     scopeIndex={this.props.scopeIndex}
    //                 />
    //             )}
    //         </React.Fragment>
    //     )
    // }
    //
    // if (this.props.cur && this.props.cur.hasOwnProperty('$__iterType')) {
    //     let old = this.props.old;
    //     if (old && old.hasOwnProperty('$__iterType')) {
    //         old = old.myobj;
    //     }
    //
    //     const iteratorType = this.props.cur.$__iterType;
    //     const loadedReferences = {};
    //
    //     return (
    //         <React.Fragment>
    //             <span className="value-iterator">&lt;{iteratorType}&gt;</span>
    //             (
    //             <AnalysisVariableValue
    //                 cur={this.props.cur.myobj}
    //                 old={old}
    //                 loadedReferences={loadedReferences}
    //                 visited={this.props.visited}
    //                 path={this.props.path}
    //                 openedPaths={this.props.openedPaths}
    //                 scopeIndex={this.props.scopeIndex}
    //             />
    //             )
    //         </React.Fragment>
    //     );
    // }

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
