import React from "react";
import {Card} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";
import {BufferEditor} from "../../../buffers/BufferEditor";
import {useAppSelector} from "../../../hooks";

export function InputOutputView() {
    const getMessage = useAppSelector(state => state.getMessage);

    return (
        <div>
            <Card>
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
                        requiredHeight='150px'
                    />
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>
                    {getMessage("IOPANE_OUTPUT")}
                </Card.Header>
                <Card.Body>
                    <BufferEditor
                        buffer='printerLibOutput'
                        readOnly={true}
                        shield={true}
                        mode='text'
                        requiredWidth='100%'
                        requiredHeight='150px'
                    />
                </Card.Body>
            </Card>
        </div>
    );
}
