import React from "react";
import {DirectiveFrame} from "./DirectiveFrame";
import {C_directiveViewDict, pythonDirectiveViewDict} from "./index";

export function DirectivePanel({scale, directive, controls, context, functionCallStack, platform, getMessage, onChange}) {
    const {kind} = directive;
    const hide = controls.hide;
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
