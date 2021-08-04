import * as React from 'react';
import {PythonVariable} from "./PythonVariable";
import {connect} from "react-redux";
import {isLoaded} from "../helpers";
import {isEmptyObject} from "../../../../utils/javascript";
import {ActionTypes} from "../../actionTypes";

interface PythonVariableValueProps {
    cur: any,
    old: any,
    openedPaths: {
        [key: string]: boolean
    },
    path: string,
    defaultopened?: boolean,
    toggle: Function,
    scopeIndex: number,
    loadedReferences: any,
    visited: any
}

class _PythonVariableValue extends React.PureComponent<PythonVariableValueProps> {
    constructor(props) {
        super(props);

        let opened = false;
        if (props.hasOwnProperty('defaultopened')) {
            opened = props.defaultopened;
        } else if (this.props.cur instanceof Sk.builtin.list || this.props.cur instanceof Sk.builtin.tuple) {
            opened = true;
        }

        this.state = {
            opened: opened
        };
    }

    isOpened = () => {
        let opened = false;
        if (
            this.props.cur instanceof Sk.builtin.list
            || this.props.cur instanceof Sk.builtin.tuple
            || this.props.cur instanceof Sk.builtin.range_
            || this.props.cur instanceof Sk.builtin.set
            || this.props.cur instanceof Sk.builtin.frozenset
        ) {
            opened = true;
        } else if (this.props.openedPaths.hasOwnProperty(this.props.path)) {
            opened = this.props.openedPaths[this.props.path];
        } else if (this.props.cur.hasOwnProperty('_uuid')) {
            if (this.props.hasOwnProperty('defaultopened')) {
                opened = this.props.defaultopened;
            }
        }

        return opened;
    }

    toggleOpened = () => {
        const isOpened = !this.isOpened();

        this.props.toggle(this.props.scopeIndex, this.props.path, isOpened);
    }

    render() {
        if (this.props.cur instanceof Sk.builtin.module) {
            return (
                <span className="value-module">&lt;module&gt;</span>
            );
        }

        if (this.props.cur instanceof Sk.builtin.func) {
            return (
                <span className="value-function">&lt;func&gt;</span>
            );
        }

        if (this.props.cur instanceof Sk.builtin.dict) {
            const elements = [];
            let isEmpty = true;
            const entries = Object.entries(this.props.cur.entries);
            for (let i in entries) {
                const key = entries[i][0];
                const item = entries[i][1];

                // Ignore the element with name __dict__ that appears in objects dictionnaries.
                if (key === '__dict__') {
                    continue;
                }

                let old = undefined;
                if (this.props.old && this.props.old instanceof Sk.builtin.dict) {
                    const oldEntry = Object.entries(this.props.old.entries)[i];
                    if (oldEntry) {
                        old = oldEntry[1][1];
                    }
                }

                const path = this.props.path + ':' + key;
                const loaded = this.props.loadedReferences.hasOwnProperty(this.props.cur._uuid + '_' + key);

                elements.push({
                    name: key,
                    value: {
                        cur: item[1],
                        old: old
                    },
                    path: path,
                    loaded: loaded
                });
                isEmpty = false;
            }

            const wasVisited = this.props.visited[this.props.cur._uuid];
            const visited = {
                ...this.props.visited,

            }
            visited[this.props.cur._uuid] = true;

            let renderedElements;
            if (wasVisited) {
                renderedElements = '...';
            } else if (isEmpty) {
                renderedElements = <span className="value-empty">&lt;&gt;</span>;
            } else {
                renderedElements = elements.map((element) => {
                    let loadedReferences = {};
                    if (element.loaded) {
                        loadedReferences = this.props.loadedReferences;
                    }

                    return (
                        <li key={element.name}>
                            <PythonVariable
                                name={element.name}
                                value={element.value}
                                visited={visited}
                                path={element.path}
                                loadedReferences={loadedReferences}
                                openedPaths={this.props.openedPaths}
                                scopeIndex={this.props.scopeIndex}
                            />
                        </li>
                    );
                });
            }

            return (
                <React.Fragment>
                    {this.isOpened() ? (
                        <React.Fragment>
                            <span className="object-toggle object-toggle-open" onClick={this.toggleOpened}>
                                <span className="toggle-icon">▾</span>
                            </span>
                            <ul className="object_scope">
                                {renderedElements}
                            </ul>
                        </React.Fragment>
                    ) : (
                        <span className="object-toggle" onClick={this.toggleOpened}>
                            <span className="toggle-icon">▸</span>
                            <span className="value-object-closed">
                                &lt;dict&gt;
                            </span>
                        </span>
                    )}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.set || this.props.cur instanceof Sk.builtin.frozenset) {
            const elements = [];
            let isEmpty = true;
            const entries = Object.entries(this.props.cur.v.entries);
            for (let i in entries) {
                const key = entries[i][0];

                // Ignore the element with name __dict__ that appears in objects dictionnaries.
                if (key === '__dict__') {
                    continue;
                }

                let old = undefined;
                if (this.props.old && this.props.old.v instanceof Sk.builtin.dict) {
                    const oldEntry = this.props.old.v.entries[i];
                    if (oldEntry) {
                        old = oldEntry[1][0];
                    }
                }

                const path = this.props.path + ':' + key;
                const loaded = this.props.loadedReferences.hasOwnProperty(this.props.cur.v._uuid + '_' + key);

                elements.push({
                    name: key,
                    value: {
                        cur: entries[i][1][0],
                        old: old
                    },
                    path: path,
                    loaded: loaded
                });
                isEmpty = false;
            }

            const wasVisited = this.props.visited[this.props.cur.v._uuid];
            const visited = {
                ...this.props.visited,

            }
            visited[this.props.cur.v._uuid] = true;

            let renderedElements;
            if (wasVisited) {
                renderedElements = '...';
            } else if (isEmpty) {
                renderedElements = <span className="value-empty">&lt;&gt;</span>;
            } else {
                renderedElements = elements.map((element, index) => {
                    let loadedReferences = {};
                    if (element.loaded) {
                        loadedReferences = this.props.loadedReferences;
                    }

                    return (
                        <span key={element.name}>
                            <PythonVariableValue
                                cur={element.value.cur}
                                old={element.value.old}
                                visited={visited}
                                path={element.path}
                                loadedReferences={loadedReferences}
                                openedPaths={this.props.openedPaths}
                                scopeIndex={this.props.scopeIndex}
                            />
                            {(index + 1) < elements.length ? ', ' : null}
                        </span>
                    );
                });
            }

            return (
                <React.Fragment>
                    {this.isOpened() ? (
                        <React.Fragment>
                            <span className="list-toggle list-toggle-open" onClick={this.toggleOpened}>
                                <span className="toggle-icon">▾</span>
                            </span>
                            &#x7B;{renderedElements}&#x7D;
                        </React.Fragment>
                    ) : (
                        <span className="list-toggle" onClick={this.toggleOpened}>
                            <span className="toggle-icon">▸</span>
                            <span className="value-list-closed">
                                &lt;{this.props.cur instanceof Sk.builtin.frozenset ? 'frozenset' : 'set'}&gt;
                            </span>
                        </span>
                    )}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.list || this.props.cur instanceof Sk.builtin.tuple || this.props.cur instanceof Sk.builtin.range_) {
            const nbElements = this.props.cur.v.length;

            const elements = [];
            for (let idx = 0; idx < this.props.cur.v.length; idx++) {
                let old = undefined;
                if (this.props.old && this.props.old instanceof Sk.builtin.list) {
                    old = this.props.old.v[idx];
                }

                const path = this.props.path + ':' + idx;
                const loaded = this.props.loadedReferences.hasOwnProperty(this.props.cur._uuid + '_' + idx);

                elements.push({
                    cur: this.props.cur.v[idx],
                    old: old,
                    path: path,
                    loaded: loaded
                });
            }

            const wasVisited = this.props.visited[this.props.cur._uuid];
            const visited = {
                ...this.props.visited,

            }
            visited[this.props.cur._uuid] = true;

            let renderedElements;
            if (wasVisited) {
                renderedElements = '...';
            } else {
                renderedElements = elements.map((element, index) => {
                    let loadedReferences = {};
                    if (element.loaded) {
                        loadedReferences = this.props.loadedReferences;
                    }

                    return (
                        <span key={index}>
                            <PythonVariableValue
                                cur={element.cur}
                                old={element.old}
                                visited={visited}
                                path={element.path}
                                loadedReferences={loadedReferences}
                                openedPaths={this.props.openedPaths}
                                scopeIndex={this.props.scopeIndex}
                            />
                            {(index + 1) < nbElements ? ', ' : null}
                        </span>
                    );
                });
            }

            let variableType = 'list';
            if (this.props.cur instanceof Sk.builtin.tuple) {
                variableType = 'tuple';
            } else if (this.props.cur instanceof Sk.builtin.range_) {
                variableType = 'range';
            }

            return (
                <React.Fragment>
                    {this.isOpened() ? (
                        <React.Fragment>
                            <span className="list-toggle list-toggle-open" onClick={this.toggleOpened}>
                                <span className="toggle-icon">▾</span>
                            </span>
                            [{renderedElements}]
                        </React.Fragment>
                    ) : (
                        <span className="list-toggle" onClick={this.toggleOpened}>
                            <span className="toggle-icon">▸</span>
                            <span className="value-list-closed">
                                &lt;{variableType}&gt;
                            </span>
                        </span>
                    )}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.object && this.props.cur.hasOwnProperty('$d')) {
            /**
             * An object's representation is as follow :
             *
             * test : Sk.builtin.object
             *   - $d : Sk.builtin.dict
             */

            let old = this.props.old;
            if (old && old instanceof Sk.builtin.object) {
                old = old.$d;
            }

            const wasVisited = this.props.visited[this.props.cur._uuid];
            const visited = {
                ...this.props.visited,

            }
            visited[this.props.cur._uuid] = true;

            let loadedReferences = {};
            if (isLoaded(this.props.loadedReferences, this.props)) {
                loadedReferences = this.props.loadedReferences;
            }

            return (
                <React.Fragment>
                    {wasVisited ? '...' : (
                        <PythonVariableValue
                            cur={this.props.cur.$d}
                            old={old}
                            visited={visited}
                            path={this.props.path}
                            loadedReferences={loadedReferences}
                            openedPaths={this.props.openedPaths}
                            scopeIndex={this.props.scopeIndex}
                        />
                    )}
                </React.Fragment>
            )
        }

        if (this.props.cur.hasOwnProperty('$__iterType')) {
            let old = this.props.old;
            if (old && old.hasOwnProperty('$__iterType')) {
                old = old.myobj;
            }

            const iteratorType = this.props.cur.$__iterType;
            const loadedReferences = {};

            return (
                <React.Fragment>
                    <span className="value-iterator">&lt;{iteratorType}&gt;</span>
                    (
                    <PythonVariableValue
                        cur={this.props.cur.myobj}
                        old={old}
                        loadedReferences={loadedReferences}
                        visited={this.props.visited}
                        path={this.props.path}
                        openedPaths={this.props.openedPaths}
                        scopeIndex={this.props.scopeIndex}
                    />
                    )
                </React.Fragment>
            );
        }

        let classes = 'value-scalar';
        if (!isEmptyObject(this.props.loadedReferences)) {
            classes = ' value-loaded';
        }

        if (this.props.cur instanceof Sk.builtin.str) {
            return (
                <React.Fragment>
                    <span className={classes}>&quot;{this.props.cur.v}&quot;</span>
                    {(this.props.old && (this.props.cur.v !== this.props.old.v)) ?
                        <span className="value-previous">&quot;{this.props.old.v}&quot;</span>
                        : null}
                </React.Fragment>
            )
        }
        if (this.props.cur instanceof Sk.builtin.bool) {
            return (
                <React.Fragment>
                    <span className={classes}>{Sk.misceval.isTrue(this.props.cur.v) ? 'True' : 'False'}</span>
                    {(this.props.old && (this.props.cur.v !== this.props.old.v)) ?
                        <span className="value-previous">{Sk.misceval.isTrue(this.props.old.v) ? 'True' : 'False'}</span>
                        : null}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.float_) {
            return (
                <React.Fragment>
                    <span className={classes}>{String(this.props.cur.v).indexOf('.') !== -1 ? this.props.cur.v : this.props.cur.v + '.0'}</span>
                    {(this.props.old && (this.props.cur.v !== this.props.old.v)) ?
                        <span className="value-previous">{String(this.props.old.v).indexOf('.') !== -1 ? this.props.old.v : this.props.old.v + '.0'}</span>
                        : null}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.bytes) {
            const byteToString = (byte: number) => {
                return String.fromCharCode(byte).match(/^[a-zA-Z0-9]$/) ? String.fromCharCode(byte) : "\\x" + byte.toString(16);
            };

            return (
                <React.Fragment>
                    <span className={classes}>b'{Array.from<number>(this.props.cur.v).map(byteToString).join('')}'</span>
                    {(this.props.old && (this.props.cur.v !== this.props.old.v)) ?
                        <span className="value-previous">b'{Array.from<number>(this.props.old.v).map(byteToString).join('')}'</span>
                        : null}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.complex) {
            const complexToString = (complex: {imag: number, real: number}) => {
                const parts = [
                    ...(complex.real !== 0 ? [complex.real] : []),
                    ...(complex.imag !== 0 ? [complex.imag + 'j'] : []),
                ];

                return parts.length ? parts.join('+') : '0';
            };

            return (
                <React.Fragment>
                    <span className={classes}>{complexToString(this.props.cur)}</span>
                    {(this.props.old && (this.props.cur.real !== this.props.old.real || this.props.cur.imag !== this.props.old.imag)) ?
                        <span className="value-previous">{complexToString(this.props.old)}</span>
                        : null}
                </React.Fragment>
            )
        }

        return (
            <React.Fragment>
                <span className={classes}>{this.props.cur.v}</span>
                {(this.props.old && (this.props.cur.v !== this.props.old.v)) ?
                    <span className="value-previous">{this.props.old.v}</span>
                    : null}
            </React.Fragment>
        );
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        toggle: (scopeIndex, path, isOpened) => dispatch({
            type: ActionTypes.StackViewPathToggle,
            payload: {
                scopeIndex,
                path,
                isOpened
            }
        })
    }
}

export const PythonVariableValue = connect(null, mapDispatchToProps)(_PythonVariableValue);
