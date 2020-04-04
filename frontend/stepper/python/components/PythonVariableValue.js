import * as React from 'react';

const PythonVariableValue = (props) => {
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

    return (
        <React.Fragment>
            <span>{props.cur.v}</span>
            {(props.old && (props.cur.v !== props.old.v)) ? <span className="value-previous">{props.old.v}</span> : null }
        </React.Fragment>
    );
};

export default PythonVariableValue;
