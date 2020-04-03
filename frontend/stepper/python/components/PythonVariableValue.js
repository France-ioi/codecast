import * as React from 'react';

const PythonVariableValue = (props) => {
    if (!props.value) {
        return (<React.Fragment></React.Fragment>);
    }

    if (props.value instanceof Sk.builtin.list) {
        const nbElements = props.value.cur.v.length;

        return (
            <React.Fragment>
                [{props.value.cur.v.map((element, index) => (
                    <span key={index}>
                        <PythonVariableValue value={element} />
                        {(index + 1) < nbElements ? ', ' : null}
                    </span>
                ))}]
            </React.Fragment>
        )
    }

    if (props.value.cur instanceof Sk.builtin.str) {
        return (
            <React.Fragment>
                "{props.value.cur.v}"
                {(props.value.old && (props.value.cur.v !== props.value.old.v)) ? <span className="value-previous">"{props.value.old.v}"</span> : null }
            </React.Fragment>
        )
    }

    return (
        <React.Fragment>
            <span>{props.value.cur.v}</span>
            {(props.value.old && (props.value.cur.v !== props.value.old.v)) ? <span className="value-previous">{props.value.old.v}</span> : null }
        </React.Fragment>
    );
};

export default PythonVariableValue;
