import * as React from 'react';
import {PythonFunctionView} from "./PythonFunctionView";
import {Button, ButtonGroup} from "@blueprintjs/core";
import {SkulptAnalysis} from "../analysis";

interface PythonStackViewProps {
    height: number,
    analysis: SkulptAnalysis,
    showStackControls?: boolean,
}

export const PythonStackView = (props: PythonStackViewProps): JSX.Element => {
    const firstVisible = 0;
    const tailCount = 0;

    return (
        <div className="stack-view" style={{maxHeight: props.height}}>
            {props.showStackControls &&
                <div className="stack-controls">
                  <ButtonGroup>
                    <Button minimal small title="navigate up the stack" icon='arrow-up'/>
                    <Button minimal small title="navigate down the stack" icon='arrow-down'/>
                  </ButtonGroup>
                </div>
            }
            {firstVisible > 0 &&
            <div key='tail' className="scope-ellipsis">
                {'… +'}{firstVisible}
            </div>
            }
            {props.analysis.functionCallStack.reverse().map((func, index) => (
                <PythonFunctionView
                    key={index}
                    scopeIndex={func.scopeIndex}
                    openedPaths={func.openedPaths}
                    loadedReferences={func.loadedReferences}
                    func={func}
                />
            ))}
            {tailCount > 0 &&
            <div key='tail' className="scope-ellipsis">
                {'… +'}{tailCount}
            </div>}
        </div>
    );
};
