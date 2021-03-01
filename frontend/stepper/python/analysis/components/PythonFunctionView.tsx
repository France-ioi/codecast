import * as React from 'react';
import {PythonFunctionHeader} from "./PythonFunctionHeader";
import {PythonFunctionLocals} from "./PythonFunctionLocals";
import {SkulptScope} from "../analysis";

interface PythonFunctionViewProps {
    func: SkulptScope,
    scopeIndex: number,
    openedPaths: {
        [key: string]: boolean
    },
    loadedReferences: any
}

export const PythonFunctionView = (props: PythonFunctionViewProps): JSX.Element => {
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
