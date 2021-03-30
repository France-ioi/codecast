import * as React from 'react';
import {PythonVariable} from "./PythonVariable";
import {SkulptScope} from "../analysis";

interface PythonFunctionLocalsProps {
    loadedReferences: any,
    func: SkulptScope,
    openedPaths: {
        [key: string]: boolean
    },
    scopeIndex: number
}

export const PythonFunctionLocals = (props: PythonFunctionLocalsProps): JSX.Element => {
    const variables = Object.entries(props.func.variables).map(([name, value]) => {
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

        return null;
    });

    return (
        <div className="scope-function-blocks">
            <ul className={!props.func.name ? 'global-scope' : null}>
                {variables}
            </ul>
        </div>
    );
};
