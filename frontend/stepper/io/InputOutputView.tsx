import React from "react";
import {Card} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";
import {BufferEditor} from "../../buffers/BufferEditor";

export class InputOutputView extends React.PureComponent {
    renderHeader = () => {
        return (
            <div className="row">
                <div className="col-sm-6">
                    {"Entrée "}
                    <Icon icon='lock'/>
                </div>
                <div className="col-sm-6">{"Sortie"}</div>
            </div>
        );
    };

    render() {
        return (
            <Card>
                <Card.Header>
                    {this.renderHeader()}
                </Card.Header>
                <Card.Body>
                    <div className="row">
                        <div className="col-sm-6">
                            <BufferEditor
                                buffer='input'
                                readOnly={true}
                                mode='text'
                                requiredWidth='100%'
                                requiredHeight='150px'/>
                        </div>
                        <div className="col-sm-6">
                            <BufferEditor
                                buffer='output'
                                readOnly={true}
                                shield={true}
                                mode='text'
                                requiredWidth='100%'
                                requiredHeight='150px'
                            />
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    };
}
