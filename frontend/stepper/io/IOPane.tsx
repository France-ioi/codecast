import React from "react";
import {TerminalView} from "../../task/libs/printer/TerminalView";
import {InputOutputView} from "../../task/libs/printer/InputOutputView";
import {IOPaneOptions} from "./IOPaneOptions";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {getCurrentStepperState} from "../selectors";
import {IoMode} from "./index";

interface IOPaneStateToProps {
    mode: string
}

function mapStateToProps(state: AppStore): IOPaneStateToProps {
    const stepper = getCurrentStepperState(state);
    const mode = stepper ? state.ioPane.mode : 'options';

    return {mode};
}

interface IOPaneDispatchToProps {
    dispatch: Function
}

interface IOPaneProps extends IOPaneStateToProps, IOPaneDispatchToProps {
    preventInput: any
}

class _IOPane extends React.PureComponent<IOPaneProps> {
    render() {
        const {preventInput} = this.props;

        switch (this.props.mode) {
            case IoMode.Terminal:
                return <TerminalView/>;
            case IoMode.Split:
                return <InputOutputView />;
            default:
                return <IOPaneOptions />;
        }
    };
}

export const IOPane = connect(mapStateToProps)(_IOPane);
