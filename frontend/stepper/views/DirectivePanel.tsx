import React from "react";
import {DirectiveFrame} from "./DirectiveFrame";
import {ShowVar as C_ShowVar} from "./c/utils";
import {Array1D as C_Array1D} from "./c/array1d";
import {Array2D as C_Array2D} from "./c/array2d";
import {SortView as C_SortView} from "./c/sort";
import MemoryViewDirective from "./c/memory";
import {Array1D as pythonArray1D} from "./python/array1d";
import {Array2D as pythonArray2D} from "./python/array2d";
import {SortView as pythonSortView} from "./python/sort";

const C_directiveViewDict = {
    showVar: {View: C_ShowVar, selector: obj => obj},
    showArray: {View: C_Array1D, selector: obj => obj},
    showArray2D: {View: C_Array2D, selector: obj => obj},
    showSort: {View: C_SortView, selector: obj => obj},
    showMemory: MemoryViewDirective,
};
const pythonDirectiveViewDict = {
    showArray: {View: pythonArray1D, selector: obj => obj},
    showArray2D: {View: pythonArray2D, selector: obj => obj},
    showSort: {View: pythonSortView, selector: obj => obj},
};

export function DirectivePanel({scale, directive, controls, context, functionCallStack, platform, getMessage, onChange}) {
    const {kind} = directive;
    const hide = controls.get('hide', false);
    if (hide) {
        return null;
    }
    if (directive[0] === 'error') {
        return <p>{'Error: '}{JSON.stringify(directive[1])}</p>;
    }

    let directiveDescription;
    if (platform === 'python') {
        if (!pythonDirectiveViewDict[kind]) {
            return <p>{'Error: undefined view kind '}{kind}</p>;
        }

        directiveDescription = pythonDirectiveViewDict[kind];
    } else {
        if (!C_directiveViewDict[kind]) {
            return <p>{'Error: undefined view kind '}{kind}</p>;
        }

        directiveDescription = C_directiveViewDict[kind];
    }

    const props = directiveDescription.selector({scale, directive, context, controls, functionCallStack});

    return (
        <directiveDescription.View
            DirectiveFrame={DirectiveFrame}
            getMessage={getMessage}
            onChange={onChange}
            {...props}
        />
    );
}
