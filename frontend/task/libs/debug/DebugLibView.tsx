import React from "react";
import {Card} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";
import {getMessage} from "../../../lang";
import {useAppSelector} from '../../../hooks';
import {Editor} from '../../../buffers/Editor';
import {DebugLibState} from './debug_lib';

export function DebugLibView() {
    const taskState: DebugLibState = useAppSelector(state => state.task.state?.debug);
    const libOutput = taskState ? taskState.linesLogged.join("\n") : '';

    return (
        <div>
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
                        hideCursor
                        highlightActiveLine={false}
                        dragEnabled={false}
                    />
                </Card.Body>
            </Card>
        </div>
    );
}
