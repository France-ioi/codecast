import React from "react";
import {Card} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";
import {getMessage} from "../../../lang";
import {useAppSelector} from '../../../hooks';
import {Editor} from '../../../buffers/Editor';
import {PrinterLib, PrinterLibState} from './printer_lib';
import {selectCurrentTest} from '../../task_slice';

export function InputOutputView() {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskState: PrinterLibState = useAppSelector(state => state.task.state);
    const libOutput = PrinterLib.getOutputTextFromEvents(taskState ? taskState.ioEvents : []);
    const libExpectedOutput = taskState ? taskState.expectedOutput : '';

    return (
        <div>
            {(taskState && !taskState.unknownInput) && <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_INPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    <Editor
                        name="printer_input"
                        content={taskState ? taskState.initial : ''}
                        readOnly
                        mode='text'
                        width='100%'
                        height='100px'
                        hideCursor
                        highlightActiveLine={false}
                        dragEnabled={false}
                    />
                </Card.Body>
            </Card>}
            <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_OUTPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    <Editor
                        name="printer_output"
                        content={libOutput}
                        readOnly
                        mode='text'
                        width='100%'
                        height='100px'
                        errorHighlight={taskState && taskState.errorHighlight ? taskState.errorHighlight : null}
                        hideCursor
                        highlightActiveLine={false}
                        dragEnabled={false}
                    />
                </Card.Body>
            </Card>
            {currentTask && <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_INITIAL_OUTPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    <Editor
                        name="test_output"
                        content={libExpectedOutput ? libExpectedOutput : ''}
                        readOnly
                        mode='text'
                        width='100%'
                        height='100px'
                        hideCursor
                        highlightActiveLine={false}
                        dragEnabled={false}
                    />
                </Card.Body>
            </Card>}
        </div>
    );
}
