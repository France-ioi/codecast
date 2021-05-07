import React from "react";
import {TerminalView} from "../../stepper/io/TerminalView";
import {InputOutputView} from "../../stepper/io/InputOutputView";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {getCurrentStepperState} from "../../stepper/selectors";
import {IoMode} from "../../stepper/io";
import {BufferEditor} from "../../buffers/BufferEditor";

interface LayoutIOPaneStateToProps {
    ioMode: IoMode,
    hasStepper: Boolean,
    getMessage: Function,
}

function mapStateToProps(state: AppStore): LayoutIOPaneStateToProps {
    return {
        ioMode: state.ioPane.mode,
        hasStepper: !!getCurrentStepperState(state),
        getMessage: state.getMessage,
    };
}

interface LayoutIOPaneDispatchToProps {
    dispatch: Function
}

interface LayoutIOPaneProps extends LayoutIOPaneStateToProps, LayoutIOPaneDispatchToProps {
    preventInput: any
}

class _LayoutIOPane extends React.PureComponent<LayoutIOPaneProps> {
    render() {
        const {preventInput, ioMode, hasStepper, getMessage} = this.props;

        if (hasStepper) {
            if (IoMode.Terminal === ioMode) {
                return <TerminalView preventInput={preventInput}/>;
            }
            if (IoMode.Split === ioMode) {
                return <InputOutputView/>;
            }
        }

        if (IoMode.Split == ioMode) {
            return (
                <div>
                    <p>{getMessage('IOPANE_INITIAL_INPUT')}</p>
                    <BufferEditor
                        buffer='input'
                        mode='text'
                        requiredWidth='100%'
                        requiredHeight='150px'
                    />
                </div>
            );
        }

        return (
            <p>{getMessage('IOPANE_TERMINAL_PROGRAM_STOPPED')}</p>
        );
    };

    static computeDimensions(width: number, height: number) {
        return {
            taken: {width, height},
            minimum: {width: 200, height: 100},
        }
    }
}

export const LayoutIOPane = connect(mapStateToProps)(_LayoutIOPane);
