import React, {useRef} from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {getCurrentStepperState} from "../../../stepper/selectors";
import {IoMode} from "../../../stepper/io";
import {useAppSelector} from "../../../hooks";
import {getMessage} from "../../../lang";
import {Card} from 'react-bootstrap';
import {Icon} from '@blueprintjs/core';
import {Editor} from '../../../buffers/Editor';
import {updateCurrentTest} from '../../task_slice';
import {useDispatch} from 'react-redux';
import {documentFromString} from '../../../buffers/document';

export function InputOutputVisualization() {
    const ioMode = useAppSelector(state => state.options.ioMode);
    const hasStepper = useAppSelector(state => !!getCurrentStepperState(state) || !state.task.resetDone);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskState = useAppSelector(state => state.task.state);
    const currentTestData = useAppSelector(state => state.task.taskTests[state.task.currentTestId]?.data);

    const currentTestDataRef = useRef<any>();
    currentTestDataRef.current = currentTestData;

    let visualization;

    const dispatch = useDispatch();

    const onEditTestInputBuffer = (delta) => {
        const currentTestInput = currentTestDataRef.current ? currentTestDataRef.current.input : '';
        const oldDoc = documentFromString(currentTestInput);
        const newDoc = oldDoc.applyDelta(delta);
        dispatch(updateCurrentTest({input: newDoc.toString()}));
    };

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
                            <Editor
                                name="test_input"
                                mode='text'
                                content={currentTestData ? currentTestData.input : ''}
                                onEdit={onEditTestInputBuffer}
                                readOnly={!!currentTask}
                                width='100%'
                                height='150px'
                                {...(currentTask ? {
                                    hideCursor: true,
                                    highlightActiveLine: false,
                                    dragEnabled: false,
                                } : {})}
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
                                <Editor
                                    name="test_output"
                                    content={currentTestData ? currentTestData.output : ''}
                                    readOnly
                                    mode='text'
                                    width='100%'
                                    height='150px'
                                    hideCursor
                                    highlightActiveLine={false}
                                    dragEnabled={false}
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
