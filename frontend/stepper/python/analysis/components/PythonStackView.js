import * as React from 'react';
import PythonFunctionView from "./PythonFunctionView";
import {Button, ButtonGroup} from "@blueprintjs/core";

const PythonStackView = (props) => {
    const callReturn = null;
    const firstVisible = 0;
    const tailCount = 0;

    /*
    if (!context) {
        return (
            <div className="stack-view" style={{height: props.height}}>
                <p>{props.getMessage('PROGRAM_STOPPED')}</p>
            </div>
        );
    }
    */

    /*
    const {programState} = context;
    if (programState && programState.error) {
        return (
            <div className="stack-view" style={{height: props.height}}>
                <Alert intent={Intent.DANGER} onClose={this.onExit}>
                    <h4>{props.getMessage('ERROR')}</h4>
                    <p>{programState.error.toString()}</p>
                </Alert>
            </div>
        );
    }
    */

    return (
        <div className="stack-view" style={{height: props.height}}>
            <div className="stack-controls">
                <ButtonGroup>
                    <Button minimal small title="navigate up the stack" icon='arrow-up'/>
                    <Button minimal small title="navigate down the stack" icon='arrow-down'/>
                </ButtonGroup>
            </div>
            {callReturn && <CallReturn view={callReturn}/>}
            {firstVisible > 0 &&
            <div key='tail' className="scope-ellipsis">
                {'… +'}{firstVisible}
            </div>
            }
            {props.analysis.functionCallStack.reverse().map((func) => (
                <PythonFunctionView
                    key={func.key}
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
            <div className="stack-bottom"/>
        </div>
    );
};

export default PythonStackView;
