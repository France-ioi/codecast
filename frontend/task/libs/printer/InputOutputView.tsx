import React from "react";
import {Card} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";
import {BufferEditor} from "../../../buffers/BufferEditor";
import {getMessage} from "../../../lang";
import {outputBufferLibTest} from './printer_lib';
import {useAppSelector} from '../../../hooks';
import {isTestPublic, selectCurrentTest, selectCurrentTestData} from '../../task_slice';

export function InputOutputView() {
    const taskState = useAppSelector(state => state.task.state);

    return (
        <div>
            {(taskState && !taskState.unknownInput) && <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_INPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    <BufferEditor
                        buffer='printerLibInput'
                        readOnly={true}
                        mode='text'
                        requiredWidth='100%'
                        requiredHeight='100px'
                    />
                </Card.Body>
            </Card>}
            <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_OUTPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    <BufferEditor
                        buffer='printerLibOutput'
                        readOnly={true}
                        mode='text'
                        requiredWidth='100%'
                        requiredHeight='100px'
                    />
                </Card.Body>
            </Card>
            <Card>
                <Card.Header className="terminal-view-header">
                    {getMessage("IOPANE_INITIAL_OUTPUT")}
                    <Icon icon='lock'/>
                </Card.Header>
                <Card.Body>
                    <BufferEditor
                        buffer={outputBufferLibTest}
                        readOnly={true}
                        mode='text'
                        requiredWidth='100%'
                        requiredHeight='100px'
                    />
                </Card.Body>
            </Card>
        </div>
    );
}
