import React from "react";
import {Panel} from 'react-bootstrap'
import {Icon} from "@blueprintjs/core";

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
            <Panel>
                <Panel.Heading>
                    {this.renderHeader()}
                </Panel.Heading>
                <Panel.Body>
                    <div className="row">
                        <div className="col-sm-6">
                            <deps.BufferEditor buffer='input' readOnly={true} mode='text' width='100%'
                                               height='150px'/>
                        </div>
                        <div className="col-sm-6">
                            <deps.BufferEditor buffer='output' readOnly={true} shield={true} mode='text'
                                               width='100%' height='150px'/>
                        </div>
                    </div>
                </Panel.Body>
            </Panel>
        );
    };

}