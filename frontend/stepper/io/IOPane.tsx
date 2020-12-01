import React from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {IOPaneOptions} from "./IOPaneOptions";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {getCurrentStepperState} from "../selectors";

interface IOPaneStateToProps {
    mode: string
}

function mapStateToProps(state: AppStore): IOPaneStateToProps {
    const stepper = getCurrentStepperState(state);
    const mode = stepper ? state.get('ioPane').mode : 'options';

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
            case 'terminal':
                return <TerminalView preventInput={preventInput} />;
            case 'split':
                return <InputOutputView />;
            default:
                return <IOPaneOptions />;
        }
    };
}

export const IOPane = connect(mapStateToProps)(_IOPane);
