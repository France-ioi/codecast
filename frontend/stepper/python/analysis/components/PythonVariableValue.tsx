import * as React from 'react';
import {Map} from 'immutable';
import PythonVariable from "./PythonVariable";
import {connect} from "react-redux";
import {isLoaded} from "../helpers";
import {isEmptyObject} from "../../../../utils/javascript";
import {ActionTypes} from "../../actionTypes";

interface PythonVariableValueProps {
    cur: any,
    old: any,
    openedPaths: Map<string, boolean>,
    path: string,
    defaultopened?: boolean,
    toggle: Function,
    scopeIndex: number,
    loadedReferences: any,
    visited: any
}

class PythonVariableValue extends React.PureComponent<PythonVariableValueProps> {
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
        if (this.props.cur.hasOwnProperty('_uuid')) {
            if (this.props.openedPaths.has(this.props.path)) {
                opened = this.props.openedPaths.get(this.props.path);
            } else if (this.props.hasOwnProperty('defaultopened')) {
                opened = this.props.defaultopened;
            } else if (this.props.cur instanceof Sk.builtin.list || this.props.cur instanceof Sk.builtin.tuple) {
                opened = true;
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
            /**
             * A dict's representation is as follow :
             *
             * test : Sk.builtin.dict
             *   - buckets
             *     - 14: (hash index example) /!\ This one only in case of an Object /!\
             *       - $hash : Sk.builtin.int_
             *         - v: 14 (hash index example)
             *       - items : [
             *         - 0 :
             *           - lhs : Sk.builtin.str
             *             - v : "__dict__"
             *             - $savedHash : (= $hash)
             *           - rhs : dict (= $d)
             *     - 16: (hash index example 2)
             *       - $hash : Sk.builtin.int_
             *         - v: 16 (hash index example 2)
             *       - items : [
             *         - 0 :
             *           - lhs : Sk.builtin.int_
             *             - v : "a" (variable name)
             *             - $savedHash : (= $hash)
             *           - rhs : Sk.builtin.int_
             *             - v: 41 (variable value)
             *       ]
             */

            const elements = [];
            let isEmpty = true;
            for (let hashKey in this.props.cur.buckets) {
                const element = this.props.cur.buckets[hashKey].items[0];

                // Ignore the element with name __dict__ that appears in objects dictionnaries.
                if (element.lhs.v === '__dict__') {
                    continue;
                }

                let old = undefined;
                if (this.props.old && this.props.old instanceof Sk.builtin.dict) {
                    const oldBucket = this.props.old.buckets[hashKey];
                    if (oldBucket) {
                        // if (oldBucket.items[0].lhs.v === element.lhs.v) {
                        //    TODO: Is this check usefull ?
                        // }

                        old = oldBucket.items[0].rhs;
                    }
                }

                const path = this.props.path + ':' + element.lhs.v;
                const loaded = this.props.loadedReferences.hasOwnProperty(this.props.cur._uuid + '_' + element.lhs.v);

                elements.push({
                    name: element.lhs.v,
                    value: {
                        cur: element.rhs,
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
                                &lt;obj&gt;
                            </span>
                        </span>
                    )}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.list || this.props.cur instanceof Sk.builtin.tuple) {
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
                            <ConnectedPythonVariableValue
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
                                &lt;list&gt;
                            </span>
                        </span>
                    )}
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.str) {
            let classes = 'value-string';
            if (!isEmptyObject(this.props.loadedReferences)) {
                classes = ' value-loaded';
            }

            return (
                <React.Fragment>
                    <span className={classes}>"{this.props.cur.v}"</span>
                    {(this.props.old && (this.props.cur.v !== this.props.old.v)) ?
                        <span className="value-previous">"{this.props.old.v}"</span>
                        : null}
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
                        <ConnectedPythonVariableValue
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
                    <ConnectedPythonVariableValue
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

const ConnectedPythonVariableValue = connect(null, mapDispatchToProps)(PythonVariableValue);

export default ConnectedPythonVariableValue;
