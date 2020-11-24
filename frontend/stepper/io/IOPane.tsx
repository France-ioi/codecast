import React from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {IOPaneOptions} from "./IOPaneOptions";

interface IOPaneProps {
    mode: any,
    preventInput: any
}

export class IOPane extends React.PureComponent<IOPaneProps> {
    render() {
        const {preventInput} = this.props;

        switch (this.props.mode) {
            case 'terminal':
                return <TerminalView preventInput={preventInput} />;
            case 'split':
                return <InputOutputView />;
            default:
                return <IOPaneOptions />;
        }
    };
}
