import * as React from 'react';
import PythonFunctionHeader from "./PythonFunctionHeader";
import PythonFunctionLocals from "./PythonFunctionLocals";

const PythonFunctionView = (props) => {
    return (
        <div className="stack-frame stack-frame-focused">
            <PythonFunctionHeader
                func={props.func}
                scopeIndex={props.scopeIndex}
                openedPaths={props.openedPaths}
            />
            <PythonFunctionLocals
                func={props.func}
                scopeIndex={props.scopeIndex}
                loadedReferences={props.loadedReferences}
                openedPaths={props.openedPaths}
            />
        </div>
    );
};

export default PythonFunctionView;
