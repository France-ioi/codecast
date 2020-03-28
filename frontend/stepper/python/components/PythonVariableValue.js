import * as React from 'react';

const PythonVariableValue = (props) => {
    if (!props.value) {
        return (<React.Fragment></React.Fragment>);
    }

    if (props.value instanceof Sk.builtin.str) {
        return (
            <React.Fragment>
                "{props.value.v}"
            </React.Fragment>
        )
    }

    return (
        <React.Fragment>
            {props.value.v}
        </React.Fragment>
    );
};

export default PythonVariableValue;
