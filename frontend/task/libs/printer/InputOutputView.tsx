import React from "react";
import {Card} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";
import {getMessage} from "../../../lang";
import {useAppSelector} from '../../../hooks';
import {Editor} from '../../../buffers/Editor';
import {PrinterLib, PrinterLibState} from './printer_lib';
import {InputEmptyState} from './InputEmptyState';
import {Range} from '../../../buffers/buffer_types';
import {faEyeSlash} from '@fortawesome/free-solid-svg-icons/faEyeSlash';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

export function InputOutputView() {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskState: PrinterLibState = useAppSelector(state => state.task.state?.printer);
    const libOutput = PrinterLib.getOutputTextFromEvents(taskState ? taskState.ioEvents : []);
    const libExpectedOutput = taskState ? taskState.expectedOutput : '';
    const consumedInput = PrinterLib.getInputTextFromEvents(taskState ? taskState.ioEvents : []);
    const consumedInputLines = consumedInput.split("\n").length;

    const consumedHighlight: Range = {
        start: {row: 0, column: 0},
        end: {row: consumedInputLines - 1, column: consumedInput.split("\n")[consumedInputLines - 1].length},
    };

    return (
        <div>
            <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_INPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    {taskState && !taskState.unknownInput ?
                        <Editor
                            name="printer_input"
                            content={taskState ? consumedInput + taskState.initial : ''}
                            readOnly
                            mode='text'
                            width='100%'
                            height='100px'
                            hideCursor
                            highlightActiveLine={false}
                            dragEnabled={false}
                            infoHighlight={consumedHighlight}
                        />
                        :
                        <InputEmptyState
                            text={getMessage("IOPANE_UNKNOWN_INPUT")}
                        />
                    }
                </Card.Body>
            </Card>
            {currentTask && <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_INITIAL_OUTPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    {taskState && !taskState.unknownOutput ?
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
                        :
                        <InputEmptyState
                            text={getMessage("IOPANE_UNKNOWN_OUTPUT")}
                        />
                    }
                </Card.Body>
            </Card>}
            <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_OUTPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    {taskState && !taskState.errorPreventingOutput ?
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
                        :
                        <InputEmptyState
                            icon={<FontAwesomeIcon icon={faTimes}/>}
                            text={getMessage("IOPANE_ERROR_PREVENTING_OUTPUT")}
                        />
                    }
                </Card.Body>
            </Card>
        </div>
    );
}
