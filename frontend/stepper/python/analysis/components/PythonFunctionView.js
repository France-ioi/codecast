import * as React from 'react';
import PythonFunctionHeader from "./PythonFunctionHeader";
import PythonFunctionLocals from "./PythonFunctionLocals";

const PythonFunctionView = (props) => {
    return (
        <div className="stack-frame stack-frame-focused">
            <PythonFunctionHeader func={props.func} />
            <PythonFunctionLocals func={props.func} />
        </div>
    );
};

export default PythonFunctionView;
