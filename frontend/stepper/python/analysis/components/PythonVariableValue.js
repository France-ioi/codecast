import * as React from 'react';
import PythonVariable from "./PythonVariable";

class PythonVariableValue extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            opened: false
        };
    }

    toggleOpened = () => {
        this.setState((state) => ({
            opened: !state.opened
        }));
    }

    render() {
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

                elements.push({
                    name: element.lhs.v,
                    value: {
                        cur: element.rhs,
                        old: old
                    }
                });
                isEmpty = false;
            }

            const wasVisited = this.props.visited[this.props.cur._uuid];
            const visited = {
                ...this.props.visited,

            }
            visited[this.props.cur._uuid] = true;

            return (
                <React.Fragment>
                    {this.state.opened ? (
                        <React.Fragment>
                            <span className="object-toggle object-toggle-open" onClick={this.toggleOpened}>
                                <span className="toggle-icon">▾</span>
                            </span>
                            <ul className="object_scope">
                                {wasVisited ? '...' : (
                                    (isEmpty) ? (
                                        <span className="value-empty">&lt;&gt;</span>
                                    ) : (
                                        elements.map((element) => (
                                            <li key={element.name}>
                                                <PythonVariable name={element.name} value={element.value} visited={visited}/>
                                            </li>
                                        ))
                                    )
                                )}
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

                elements.push({
                    cur: this.props.cur.v[idx],
                    old: old
                });
            }

            const wasVisited = this.props.visited[this.props.cur._uuid];
            const visited = {
                ...this.props.visited,

            }
            visited[this.props.cur._uuid] = true;

            return (
                <React.Fragment>
                    [{wasVisited ? '...' : (
                    elements.map((element, index) => (
                        <span key={index}>
                                <PythonVariableValue cur={element.cur} old={element.old} visited={visited}/>
                            {(index + 1) < nbElements ? ', ' : null}
                            </span>
                    ))
                )}]
                </React.Fragment>
            )
        }

        if (this.props.cur instanceof Sk.builtin.str) {
            return (
                <React.Fragment>
                    <span className="value-string">"{this.props.cur.v}"</span>
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

            return (
                <React.Fragment>
                    {wasVisited ? '...' : (
                        <PythonVariableValue cur={this.props.cur.$d} old={old} visited={visited} />
                    )}
                </React.Fragment>
            )
        }

        return (
            <React.Fragment>
                <span className="value-scalar">{this.props.cur.v}</span>
                {(this.props.old && (this.props.cur.v !== this.props.old.v)) ?
                    <span className="value-previous">{this.props.old.v}</span> : null}
            </React.Fragment>
        );
    }
}

export default PythonVariableValue;
