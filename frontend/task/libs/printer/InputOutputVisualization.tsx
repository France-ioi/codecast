import React from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {getCurrentStepperState} from "../../../stepper/selectors";
import {IoMode} from "../../../stepper/io";
import {BufferEditor} from "../../../buffers/BufferEditor";
import {useAppSelector} from "../../../hooks";
import {inputBufferLibTest, outputBufferLibTest} from "./printer_lib";
import {getMessage} from "../../../lang";
import {Card} from 'react-bootstrap';
import {Icon} from '@blueprintjs/core';

export function InputOutputVisualization() {
    const ioMode = useAppSelector(state => state.options.ioMode);
    const hasStepper = useAppSelector(state => !!getCurrentStepperState(state) || !state.task.resetDone);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskState = useAppSelector(state => state.task.state);

    let visualization;

    if (IoMode.Terminal === ioMode) {
        visualization = <TerminalView/>;
    } else if (IoMode.Split === ioMode) {
        if (hasStepper || (taskState && taskState.ioEvents.length)) {
            visualization = <InputOutputView/>;
        } else {
            visualization = (
                <div>
                    <Card>
                        <Card.Header className="terminal-view-header">
                            {getMessage("IOPANE_INITIAL_INPUT")}
                            {!!currentTask && <Icon icon='lock'/>}
                        </Card.Header>
                        <Card.Body>
                            <BufferEditor
                                buffer={inputBufferLibTest}
                                mode='text'
                                readOnly={!!currentTask}
                                requiredWidth='100%'
                                requiredHeight='150px'
                                editorProps={currentTask ? {
                                    hideCursor: true,
                                    highlightActiveLine: false,
                                    dragEnabled: false,
                                } : {}}
                            />
                        </Card.Body>
                    </Card>

                    {currentTask &&
                        <Card>
                            <Card.Header className="terminal-view-header">
                                {getMessage("IOPANE_INITIAL_OUTPUT")}
                                <Icon icon='lock'/>
                            </Card.Header>
                            <Card.Body>
                                <BufferEditor
                                    buffer={outputBufferLibTest}
                                    readOnly
                                    mode='text'
                                    requiredWidth='100%'
                                    requiredHeight='150px'
                                    editorProps={{
                                        hideCursor: true,
                                        highlightActiveLine: false,
                                        dragEnabled: false,
                                    }}
                                />
                            </Card.Body>
                        </Card>
                    }
                </div>
            );
        }
    } else {
        visualization = <p>{getMessage('IOPANE_TERMINAL_PROGRAM_STOPPED')}</p>;
    }

    return <div className="io-visualization">{visualization}</div>
}
