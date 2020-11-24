import * as React from 'react';
import {Map} from 'immutable';
import PythonVariable from "./PythonVariable";
import {SkulptScope} from "../analysis";

interface PythonFunctionLocalsProps {
    loadedReferences: any,
    func: SkulptScope,
    openedPaths: Map<string, boolean>,
    scopeIndex: number
}

const PythonFunctionLocals = (props: PythonFunctionLocalsProps): JSX.Element => {
    const variables = props.func.variables.entrySeq().map(([name, value]) => {
        if (value.cur !== undefined &&
            !(value.cur instanceof Sk.builtin.module) &&
            !(value.cur instanceof Sk.builtin.func)
        ) {
            let loadedReferences = {};
            if (props.loadedReferences.hasOwnProperty(name)) {
                loadedReferences = props.loadedReferences;
            }

            return (
                <li key={name}>
                    <PythonVariable
                        name={name}
                        value={value}
                        visited={{}}
                        loadedReferences={loadedReferences}
                        openedPaths={props.openedPaths}
                        scopeIndex={props.scopeIndex}
                    />
                </li>
            );
        }
    });

    return (
        <div className="scope-function-blocks">
            <ul className={!props.func.name ? 'global-scope' : null}>
                {variables}
            </ul>
        </div>
    );
};

export default PythonFunctionLocals;
