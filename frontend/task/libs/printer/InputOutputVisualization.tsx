import React, {useRef} from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {getCurrentStepperState} from "../../../stepper/selectors";
import {IoMode} from "../../../stepper/io";
import {useAppSelector} from "../../../hooks";
import {getMessage} from "../../../lang";
import {Card} from 'react-bootstrap';
import {Icon} from '@blueprintjs/core';
import {BufferEditor} from '../../../buffers/BufferEditor';
import {inputBufferLibTest, outputBufferLibTest} from './printer_lib';
import {selectCurrentTest} from '../../task_slice';
import {TaskTestGroupType} from '../../task_types';

// To avoid re-rendering because of new object
const bufferNonEditableOptions = {
    hideCursor: true,
    highlightActiveLine: false,
    dragEnabled: false,
};
const bufferEditableOptions = {};

export function InputOutputVisualization() {
    const ioMode = useAppSelector(state => state.options.ioMode);
    const hasStepper = useAppSelector(state => !!getCurrentStepperState(state) || !state.task.resetDone);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskState = useAppSelector(state => state.task.state?.printer);
    const currentTest = useAppSelector(selectCurrentTest);
    const currentTestData = currentTest?.data;
    const currentTestEditable = !currentTask || (currentTest && TaskTestGroupType.User === currentTest.groupType);

    const currentTestDataRef = useRef<any>();
    currentTestDataRef.current = currentTestData;

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
                            {!currentTestEditable && <Icon icon='lock'/>}
                        </Card.Header>
                        <Card.Body>
                            {/*Use a buffer to allow recording cursor moves here*/}
                            <BufferEditor
                                buffer={inputBufferLibTest}
                                mode='text'
                                readOnly={!currentTestEditable}
                                requiredWidth='100%'
                                requiredHeight='150px'
                                editorProps={!currentTestEditable ? bufferNonEditableOptions : bufferEditableOptions}
                            />
                        </Card.Body>
                    </Card>

                    {currentTask &&
                        <Card>
                            <Card.Header className="terminal-view-header">
                                {getMessage("IOPANE_INITIAL_OUTPUT")}
                                {!currentTestEditable && <Icon icon='lock'/>}
                            </Card.Header>
                            <Card.Body>
                                <BufferEditor
                                    buffer={outputBufferLibTest}
                                    mode='text'
                                    readOnly={!currentTestEditable}
                                    requiredWidth='100%'
                                    requiredHeight='150px'
                                    editorProps={!currentTestEditable ? bufferNonEditableOptions : bufferEditableOptions}
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
