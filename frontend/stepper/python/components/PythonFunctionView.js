import * as React from 'react';
import PythonFunctionHeader from "./PythonFunctionHeader";
import classnames from "classnames";
import PythonFunctionLocals from "./PythonFunctionLocals";

const PythonFunctionView = (props) => {
    return (
        <div className={classnames(['stack-frame', 'stack-frame-focused'/*, view.focus && 'stack-frame-focused'*/])}>
            <PythonFunctionHeader func={props.func} />
            <PythonFunctionLocals func={props.func} />
        </div>
    );
};

export default PythonFunctionView;
