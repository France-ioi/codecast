import * as React from 'react';
import PythonVariable from "./PythonVariable";

const PythonVariableValue = (props) => {
    if (props.cur instanceof Sk.builtin.dict) {
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
        for (let hashKey in props.cur.buckets) {
            const element = props.cur.buckets[hashKey].items[0];

            // Ignore the element with name __dict__ that appears in objects dictionnaries.
            if (element.lhs.v === '__dict__') {
                continue;
            }

            let old = undefined;
            if (props.old && props.old instanceof Sk.builtin.dict) {
                const oldBucket = props.old.buckets[hashKey];
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
            })
        }

        return (
            <React.Fragment>
                <ul className="object_scope">
                    {elements.map((element) => (
                        <li key={element.name}>
                            <PythonVariable name={element.name} value={element.value} />
                        </li>
                    ))}
                </ul>
            </React.Fragment>
        )
    }

    if (props.cur instanceof Sk.builtin.list) {
        const nbElements = props.cur.v.length;

        const elements = [];
        for (let idx = 0; idx < props.cur.v.length; idx++) {
            let old = undefined;
            if (props.old && props.old instanceof Sk.builtin.list) {
                old = props.old.v[idx];
            }

            elements.push({
                cur: props.cur.v[idx],
                old: old
            });
        }

        return (
            <React.Fragment>
                [{elements.map((element, index) => (
                    <span key={index}>
                        <PythonVariableValue cur={element.cur} old={element.old} />
                        {(index + 1) < nbElements ? ', ' : null}
                    </span>
                ))}]
            </React.Fragment>
        )
    }

    if (props.cur instanceof Sk.builtin.str) {
        return (
            <React.Fragment>
                <span>"{props.cur.v}"</span>
                {(props.old && (props.cur.v !== props.old.v)) ? <span className="value-previous">"{props.old.v}"</span> : null }
            </React.Fragment>
        )
    }

    if (props.cur instanceof Sk.builtin.object && props.cur.hasOwnProperty('$d')) {
        /**
         * An object's representation is as follow :
         *
         * test : Sk.builtin.object
         *   - $d : Sk.builtin.dict
         */

        let old = props.old;
        if (old && old instanceof Sk.builtin.object) {
            old = old.$d;
        }

        return (
            <PythonVariableValue cur={props.cur.$d} old={old} />
        )
    }

    return (
        <React.Fragment>
            <span>{props.cur.v}</span>
            {(props.old && (props.cur.v !== props.old.v)) ? <span className="value-previous">{props.old.v}</span> : null }
        </React.Fragment>
    );
};

export default PythonVariableValue;
