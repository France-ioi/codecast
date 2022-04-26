import {VIEW_DIRECTIVE_PREFIX} from "../directives";
import {AnalysisScope, AnalysisSnapshot, AnalysisStackFrame, AnalysisVariable} from "../../analysis";
import {DebugProtocol} from "vscode-debugprotocol";
import * as React from "react";
import {isLoaded} from "../../analysis/helpers";
import {isEmptyObject} from "../../../utils/javascript";
import {AnalysisVariableValue} from "../../analysis/AnalysisVariableValue";

export interface SkulptAnalysis {
    functionCallStack?: SkulptScope[],
    stepNum: number,
    code: string,
    lines?: string[]
}

export interface SkulptVariable {
    cur: any,
    old: any
}

export interface SkulptScope {
    variables: {
        [key: string]: SkulptVariable
    },
    directives: any[],
    name: string,
    args: string[],
    openedPaths: {
        [key: string]: boolean
    },
    loadedReferences: any, // TODO: Add type
    currentLine: number,
    currentColumn: number,
    suspensionIdx: number,
    scopeIndex: number
}

/**
 * Enable debug of skulpt analysis.
 *
 * 0 : No analysis
 * 1 : Only the result of analysis
 * 2 : The details of analysis
 *
 * @type {int}
 */
const SKULPT_ANALYSIS_DEBUG = 1;

export const convertSkulptStateToAnalysisSnapshot = function (suspensions: readonly any[], lastAnalysis: AnalysisSnapshot, newStepNum: number): AnalysisSnapshot {
    // @ts-ignore
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('[¥¥¥¥¥¥¥] Building analysis');
        console.log(suspensions);
        console.log(lastAnalysis);
    }

    let stackFrames: AnalysisStackFrame[] = [];

    if (suspensions) {
        let stackFrameIndex = 0;
        for (let suspensionIdx = 0; suspensionIdx < suspensions.length; suspensionIdx++) {
            const suspension = suspensions[suspensionIdx];
            if (!isProgramSuspension(suspension)) {
                continue;
            }

            let lastScopeAnalysis = null;
            if (lastAnalysis && lastAnalysis.stackFrames && lastAnalysis.stackFrames.length > stackFrameIndex) {
                lastScopeAnalysis = lastAnalysis.stackFrames[stackFrameIndex];
            }

            let suspVariables;
            if (Object.keys(suspension.$loc).length === 0 && suspension.$loc.constructor === Object) {
                // If $loc is empty, we are in a function's scope.
                suspVariables = suspension.$tmps;
            } else {
                suspVariables = suspension.$loc;
            }

            const stackFrame: AnalysisStackFrame = {
                id: suspensionIdx,
                name: null,
                column: suspension.$colno,
                line: suspension.$lineno,
                directives: getDirectiveVariables(suspVariables),
                scopes: [],
            };

            const scope = analyseSkulptScope(suspension, newStepNum, suspensionIdx, stackFrameIndex);
            stackFrame.scopes.push(scope);
            stackFrame.name = scope.name;
            stackFrames.push(stackFrame);

            stackFrameIndex++;
        }
    }

    const analysis = {
        ...lastAnalysis,
        stackFrames,
        stepNum: newStepNum
    };

    if (SKULPT_ANALYSIS_DEBUG > 0) {
        console.log('[¥¥¥¥¥¥¥] End of building analysis');
        console.log(analysis);
    }

    return Object.freeze(analysis);
};

/**
 * Checks whether a suspension is a program's suspension.
 * It can also be only a promise encapsulated in a suspension when certain functions are called.
 *
 * @param {Object} suspension The suspension.
 *
 * @returns {boolean}
 */
const isProgramSuspension = function(suspension): boolean {
    return suspension.hasOwnProperty('$lineno');
};

/**
 * Transforms the skulpt scope (one suspension) to something readable with the variables content.
 *
 * @param suspension    The skulpt suspension.
 * @param newStepNum    The new Skulpt step number.
 * @param suspensionIdx
 * @param scopeIndex
 */
export const analyseSkulptScope = function(suspension: any, newStepNum: number, suspensionIdx: number, scopeIndex: number): AnalysisScope {
    // @ts-ignore
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('////// Analyse scope...');
        console.log(suspension);
    }

    let variables: (string | DebugProtocol.Variable)[] = [];

    let name = suspension._name;
    if (name === '<module>') {
        name = '';
    }

    const args = suspension._argnames;

    let suspVariables;
    if (Object.keys(suspension.$loc).length === 0 && suspension.$loc.constructor === Object) {
        // If $loc is empty, we are in a function's scope.

        suspVariables = suspension.$tmps;
    } else {
        suspVariables = suspension.$loc;
    }

    const variableNames = sortArgumentsFirst(filterInternalVariables(Object.keys(suspVariables)), args);

    for (let variableName of variableNames) {
        let value = suspVariables[variableName];

        if (typeof value === 'function') {
            if (!value.prototype || !value.prototype.tp$name) {
                continue;
            }
            value = `<class '${value.prototype.tp$name}'>`;
        }

        const variable = convertSkulptValueToDAPVariable(Sk.unfixReserved(variableName), value);
        variables.push(variable);
    }

    const analysis: AnalysisScope = {
        variables,
        variablesReference: 0,
        expensive: false,
        name,
        // args,
        // suspensionIdx,
        // scopeIndex
    };

    // @ts-ignore
    if (SKULPT_ANALYSIS_DEBUG === 2) {
        console.log('////// End of analyse scope...');
        console.log(analysis);
    }

    return analysis;
};

// To filter the internal variables of Skulpt.
const variablesBeginWithIgnore = [
    '__name__',
    '__doc__',
    '__package__',
    '__file__',
    '__class__',
    '__refs__',
    VIEW_DIRECTIVE_PREFIX,
    '$compareres',
    '$loadgbl',
    '$binop',
    '$lsubscr',
    '$iter',
    '$call',
    '$loadtuple',
    '$items',
    '$elem',
    '$lattr'
];

/**
 * Filter the variable names by removing those used internally by Skulpt.
 *
 * @param {Array} variableNames The names.
 *
 * @returns {Array}
 */
const filterInternalVariables = (variableNames: string[]): string[] => {
    return variableNames.filter((name) => {
        let ignore = false;
        for (let variableBeginWithIgnore of variablesBeginWithIgnore) {
            if (name.indexOf(variableBeginWithIgnore) === 0) {
                return false;
            }
        }

        return true;
    });
};

const getDirectiveVariables = (variables) => {
    let directiveVariables = [];
    for (let variableName in variables) {
        if (variableName.startsWith(VIEW_DIRECTIVE_PREFIX)) {
            const directiveName = variableName.substr(VIEW_DIRECTIVE_PREFIX.length);

            if (variables[variableName]) {
                directiveVariables.push(directiveName + ' = ' + variables[variableName].v);
            }
        }
    }

    return directiveVariables;
};

/**
 * Sort by putting arguments first.
 *
 * @param {Array} variableNames The variable names.
 * @param {Array} args          The arguments.
 *
 * @return {Array}
 */
const sortArgumentsFirst = (variableNames: string[], args) => {
    return variableNames.sort((a, b) => {
        const aIsArg = (args && args.indexOf(a) !== -1);
        const bIsArg = (args && args.indexOf(b) !== -1);

        if (aIsArg && !bIsArg) {
            return -1;
        } else if (bIsArg && !aIsArg) {
            return 1;
        }

        return a.localeCompare(b);
    });
};

/**
 * Gets a copy of skulpt suspensions.
 *
 * @param {Array} suspensions The suspensions.
 *
 * @return {Array} A copy of the suspensions.
 */
export const getSkulptSuspensionsCopy = function(suspensions) {
    const copies = [];
    for (let suspensionIdx in suspensions) {
        const suspension = suspensions[suspensionIdx];

        copies[suspensionIdx] = {
            ...suspension
        };
    }

    return Object.freeze(copies);
}

/**
 * Clears the loaded references.
 *
 * @param analysis
 */
export const clearLoadedReferences = function(analysis: AnalysisSnapshot) {
    //TODO this
    // const clearedAnalysis = {
    //     ...analysis,
    //     functionCallStack: []
    // };
    // for (let idx = 0; idx < analysis.functionCallStack.length; idx++) {
    //     const clearedFunctionCallStack = {
    //         ...analysis.functionCallStack[idx],
    //         loadedReferences: {}
    //     }
    //
    //     clearedAnalysis.functionCallStack.push(clearedFunctionCallStack);
    // }

    return analysis;
}

export const convertSkulptValueToDAPVariable = (name: string, value: any): AnalysisVariable => {
    let variableData = {
        name,
        type: value.constructor.prototype.tp$name,
    };

    if (value instanceof Sk.builtin.module) {
        return {
            ...variableData,
            value: '<module>',
            variablesReference: 0,
        };
    }

    if (value instanceof Sk.builtin.func) {
        return {
            ...variableData,
            value: '<func>',
            variablesReference: 0,
        };
    }

    return {
        ...variableData,
        value: value.v,
        variablesReference: 0,
    };

//     if (value instanceof Sk.builtin.dict) {
//         const elements = [];
//         let isEmpty = true;
//         const entries = Object.entries(value.entries);
//         for (let i in entries) {
//             const key = entries[i][0];
//             const item = entries[i][1];
//
//             // Ignore the element with name __dict__ that appears in objects dictionnaries.
//             if (key === '__dict__') {
//                 continue;
//             }
//
//             let old = undefined;
//             if (this.props.old && this.props.old instanceof Sk.builtin.dict) {
//                 const oldEntry = Object.entries(this.props.old.entries)[i];
//                 if (oldEntry) {
//                     old = oldEntry[1][1];
//                 }
//             }
//
//             const path = this.props.path + ':' + key;
//             const loaded = this.props.loadedReferences.hasOwnProperty(value._uuid + '_' + key);
//
//             elements.push({
//                 name: key,
//                 value: {
//                     cur: item[1],
//                     old: old
//                 },
//                 path: path,
//                 loaded: loaded
//             });
//             isEmpty = false;
//         }
//
//         const wasVisited = this.props.visited[value._uuid];
//         const visited = {
//             ...this.props.visited,
//
//         }
//         visited[value._uuid] = true;
//
//         let renderedElements;
//         if (wasVisited) {
//             renderedElements = '...';
//         } else if (isEmpty) {
//             renderedElements = <span className="value-empty">&lt;&gt;</span>;
//         } else {
//             renderedElements = elements.map((element) => {
//                 let loadedReferences = {};
//                 if (element.loaded) {
//                     loadedReferences = this.props.loadedReferences;
//                 }
//
//                 return (
//                     <li key={element.name}>
//                     <AnalysisVariable
//                         name={element.name}
//                 value={element.value}
//                 visited={visited}
//                 path={element.path}
//                 loadedReferences={loadedReferences}
//                 openedPaths={this.props.openedPaths}
//                 scopeIndex={this.props.scopeIndex}
//                 />
//                 </li>
//             );
//             });
//         }
//
//         return (
//             <React.Fragment>
//                 {this.isOpened() ? (
//                         <React.Fragment>
//                             <span className="object-toggle object-toggle-open" onClick={this.toggleOpened}>
//                     <span className="toggle-icon">▾</span>
//         </span>
//         <ul className="object_scope">
//             {renderedElements}
//             </ul>
//             </React.Fragment>
//     ) : (
//             <span className="object-toggle" onClick={this.toggleOpened}>
//         <span className="toggle-icon">▸</span>
//         <span className="value-object-closed">
//             &lt;dict&gt;
//                 </span>
//             </span>
//     )}
//         </React.Fragment>
//     )
//     }
//
//     if (value instanceof Sk.builtin.set || value instanceof Sk.builtin.frozenset) {
//         const elements = [];
//         let isEmpty = true;
//         const entries = Object.entries(value.v.entries);
//         for (let i in entries) {
//             const key = entries[i][0];
//
//             // Ignore the element with name __dict__ that appears in objects dictionnaries.
//             if (key === '__dict__') {
//                 continue;
//             }
//
//             let old = undefined;
//             if (this.props.old && this.props.old.v instanceof Sk.builtin.dict) {
//                 const oldEntry = this.props.old.v.entries[i];
//                 if (oldEntry) {
//                     old = oldEntry[1][0];
//                 }
//             }
//
//             const path = this.props.path + ':' + key;
//             const loaded = this.props.loadedReferences.hasOwnProperty(value.v._uuid + '_' + key);
//
//             elements.push({
//                 name: key,
//                 value: {
//                     cur: entries[i][1][0],
//                     old: old
//                 },
//                 path: path,
//                 loaded: loaded
//             });
//             isEmpty = false;
//         }
//
//         const wasVisited = this.props.visited[value.v._uuid];
//         const visited = {
//             ...this.props.visited,
//
//         }
//         visited[value.v._uuid] = true;
//
//         let renderedElements;
//         if (wasVisited) {
//             renderedElements = '...';
//         } else if (isEmpty) {
//             renderedElements = <span className="value-empty">&lt;&gt;</span>;
//         } else {
//             renderedElements = elements.map((element, index) => {
//                 let loadedReferences = {};
//                 if (element.loaded) {
//                     loadedReferences = this.props.loadedReferences;
//                 }
//
//                 return (
//                     <span key={element.name}>
//                     <AnalysisVariableValue
//                         cur={element.value.cur}
//                 old={element.value.old}
//                 visited={visited}
//                 path={element.path}
//                 loadedReferences={loadedReferences}
//                 openedPaths={this.props.openedPaths}
//                 scopeIndex={this.props.scopeIndex}
//                 />
//                 {(index + 1) < elements.length ? ', ' : null}
//                 </span>
//             );
//             });
//         }
//
//         return (
//             <React.Fragment>
//                 {this.isOpened() ? (
//                         <React.Fragment>
//                             <span className="list-toggle list-toggle-open" onClick={this.toggleOpened}>
//                     <span className="toggle-icon">▾</span>
//         </span>
//         &#x7B;{renderedElements}&#x7D;
//         </React.Fragment>
//     ) : (
//             <span className="list-toggle" onClick={this.toggleOpened}>
//         <span className="toggle-icon">▸</span>
//         <span className="value-list-closed">
//             &lt;{value instanceof Sk.builtin.frozenset ? 'frozenset' : 'set'}&gt;
//                 </span>
//             </span>
//     )}
//         </React.Fragment>
//     )
//     }
//
//     if (value instanceof Sk.builtin.list || value instanceof Sk.builtin.tuple || value instanceof Sk.builtin.range_) {
//         const nbElements = value.v.length;
//
//         const elements = [];
//         for (let idx = 0; idx < value.v.length; idx++) {
//             let old = undefined;
//             if (this.props.old && this.props.old instanceof Sk.builtin.list) {
//                 old = this.props.old.v[idx];
//             }
//
//             const path = this.props.path + ':' + idx;
//             const loaded = this.props.loadedReferences.hasOwnProperty(value._uuid + '_' + idx);
//
//             elements.push({
//                 cur: value.v[idx],
//                 old: old,
//                 path: path,
//                 loaded: loaded
//             });
//         }
//
//         const wasVisited = this.props.visited[value._uuid];
//         const visited = {
//             ...this.props.visited,
//
//         }
//         visited[value._uuid] = true;
//
//         let renderedElements;
//         if (wasVisited) {
//             renderedElements = '...';
//         } else {
//             renderedElements = elements.map((element, index) => {
//                 let loadedReferences = {};
//                 if (element.loaded) {
//                     loadedReferences = this.props.loadedReferences;
//                 }
//
//                 return (
//                     <span key={index}>
//                     <AnalysisVariableValue
//                         cur={element.cur}
//                 old={element.old}
//                 visited={visited}
//                 path={element.path}
//                 loadedReferences={loadedReferences}
//                 openedPaths={this.props.openedPaths}
//                 scopeIndex={this.props.scopeIndex}
//                 />
//                 {(index + 1) < nbElements ? ', ' : null}
//                 </span>
//             );
//             });
//         }
//
//         let variableType = 'list';
//         if (value instanceof Sk.builtin.tuple) {
//             variableType = 'tuple';
//         } else if (value instanceof Sk.builtin.range_) {
//             variableType = 'range';
//         }
//
//         return (
//             <React.Fragment>
//                 {this.isOpened() ? (
//                         <React.Fragment>
//                             <span className="list-toggle list-toggle-open" onClick={this.toggleOpened}>
//                     <span className="toggle-icon">▾</span>
//         </span>
//             [{renderedElements}]
//         </React.Fragment>
//     ) : (
//             <span className="list-toggle" onClick={this.toggleOpened}>
//         <span className="toggle-icon">▸</span>
//         <span className="value-list-closed">
//             &lt;{variableType}&gt;
//                 </span>
//             </span>
//     )}
//         </React.Fragment>
//     )
//     }
//
//     if (value instanceof Sk.builtin.object && value.hasOwnProperty('$d')) {
//         /**
//          * An object's representation is as follow :
//          *
//          * test : Sk.builtin.object
//          *   - $d : Sk.builtin.dict
//          */
//
//         console.log('object => ', this.props);
//
//         let old = this.props.old;
//         if (old && old instanceof Sk.builtin.object) {
//             old = old.$d;
//         }
//
//         const wasVisited = this.props.visited[value._uuid];
//         const visited = {
//             ...this.props.visited,
//
//         }
//         visited[value._uuid] = true;
//
//         let loadedReferences = {};
//         if (isLoaded(this.props.loadedReferences, this.props)) {
//             loadedReferences = this.props.loadedReferences;
//         }
//
//         return (
//             <React.Fragment>
//                 {wasVisited ? '...' : (
//                         <AnalysisVariableValue
//                             cur={value.$d}
//                     old={old}
//                     visited={visited}
//                     path={this.props.path}
//                     loadedReferences={loadedReferences}
//                     openedPaths={this.props.openedPaths}
//                     scopeIndex={this.props.scopeIndex}
//         />
//     )}
//         </React.Fragment>
//     )
//     }
//
//     if (value && value.hasOwnProperty('$__iterType')) {
//         let old = this.props.old;
//         if (old && old.hasOwnProperty('$__iterType')) {
//             old = old.myobj;
//         }
//
//         const iteratorType = value.$__iterType;
//         const loadedReferences = {};
//
//         return (
//             <React.Fragment>
//                 <span className="value-iterator">&lt;{iteratorType}&gt;</span>
//             (
//                 <AnalysisVariableValue
//                     cur={value.myobj}
//         old={old}
//         loadedReferences={loadedReferences}
//         visited={this.props.visited}
//         path={this.props.path}
//         openedPaths={this.props.openedPaths}
//         scopeIndex={this.props.scopeIndex}
//         />
//     )
//         </React.Fragment>
//     );
//     }
//
//     let classes = 'value-scalar';
//     if (!isEmptyObject(this.props.loadedReferences)) {
//         classes = ' value-loaded';
//     }
//
//     if (value instanceof Sk.builtin.str) {
//         return (
//             <React.Fragment>
//                 <span className={classes}>&quot;{value.v}&quot;</span>
//         {(this.props.old && (value.v !== this.props.old.v)) ?
//             <span className="value-previous">&quot;{this.props.old.v}&quot;</span>
//         : null}
//         </React.Fragment>
//     )
//     }
//     if (value instanceof Sk.builtin.bool) {
//         return (
//             <React.Fragment>
//                 <span className={classes}>{Sk.misceval.isTrue(value.v) ? 'True' : 'False'}</span>
//         {(this.props.old && (value.v !== this.props.old.v)) ?
//             <span className="value-previous">{Sk.misceval.isTrue(this.props.old.v) ? 'True' : 'False'}</span>
//             : null}
//         </React.Fragment>
//     )
//     }
//
//     if (value instanceof Sk.builtin.float_) {
//         return (
//             <React.Fragment>
//                 <span className={classes}>{String(value.v).indexOf('.') !== -1 ? value.v : value.v + '.0'}</span>
//         {(this.props.old && (value.v !== this.props.old.v)) ?
//             <span className="value-previous">{String(this.props.old.v).indexOf('.') !== -1 ? this.props.old.v : this.props.old.v + '.0'}</span>
//         : null}
//         </React.Fragment>
//     )
//     }
//
//     if (value instanceof Sk.builtin.bytes) {
//         const byteToString = (byte: number) => {
//             return String.fromCharCode(byte).match(/^[a-zA-Z0-9]$/) ? String.fromCharCode(byte) : "\\x" + byte.toString(16);
//         };
//
//         return (
//             <React.Fragment>
//                 <span className={classes}>b&#39;{Array.from<number>(value.v).map(byteToString).join('')}&#39;</span>
//         {(this.props.old && (value.v !== this.props.old.v)) ?
//             <span className="value-previous">b&#39;{Array.from<number>(this.props.old.v).map(byteToString).join('')}&#39;</span>
//         : null}
//         </React.Fragment>
//     )
//     }
//
//     if (value instanceof Sk.builtin.complex) {
//         const complexToString = (complex: {imag: number, real: number}) => {
//             const parts = [
//                 ...(complex.real !== 0 ? [complex.real] : []),
//                 ...(complex.imag !== 0 ? [complex.imag + 'j'] : []),
//             ];
//
//             return parts.length ? parts.join('+') : '0';
//         };
//
//         return (
//             <React.Fragment>
//                 <span className={classes}>{complexToString(value)}</span>
//         {(this.props.old && (value.real !== this.props.old.real || value.imag !== this.props.old.imag)) ?
//             <span className="value-previous">{complexToString(this.props.old)}</span>
//         : null}
//         </React.Fragment>
//     )
//     }
//
//     if (value && undefined !== value.v && null !== value.v) {
//         return (
//             <React.Fragment>
//                 <span className={classes}>{value.v}</span>
//         {(this.props.old && (value.v !== this.props.old.v)) && !Array.isArray(this.props.old.v) ?
//             <span className="value-previous">{this.props.old.v}</span>
//             : null}
//         </React.Fragment>
//     );
//     }
//
//     return (
//         <React.Fragment>
//             <span className={classes}>{value}</span>
//     {(this.props.old && (value !== this.props.old)) ?
//         <span className="value-previous">{this.props.old}</span>
//         : null}
//     </React.Fragment>
// );
}
