import React from "react";
import {Card} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";
import {BufferEditor} from "../../buffers/BufferEditor";
import {connect} from "react-redux";
import {AppStore} from "../../store";

interface InputOutputViewProps {
    getMessage: Function,
}

function mapStateToProps(state: AppStore): InputOutputViewProps {
    return {
        getMessage: state.getMessage,
    };
}

class _InputOutputView extends React.PureComponent<InputOutputViewProps> {
    render() {
        const {getMessage} = this.props;

        return (
            <div>
                <Card>
                    <Card.Header className="terminal-view-header">
                        {getMessage("IOPANE_INPUT")}
                        <Icon icon='lock'/>
                    </Card.Header>
                    <Card.Body>
                        <BufferEditor
                            buffer='input'
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
                            buffer='output'
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
    };
}

export const InputOutputView = connect(mapStateToProps)(_InputOutputView);
