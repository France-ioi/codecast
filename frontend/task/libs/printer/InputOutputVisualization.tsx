import React from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {getCurrentStepperState} from "../../../stepper/selectors";
import {IoMode} from "../../../stepper/io";
import {BufferEditor} from "../../../buffers/BufferEditor";
import {useAppSelector} from "../../../hooks";

interface InputOutputVisualizationProps {
    preventInput: any
}

export function InputOutputVisualization(props: InputOutputVisualizationProps) {
    const ioMode = useAppSelector(state => state.ioPane.mode);
    const hasStepper = useAppSelector(state => !!getCurrentStepperState(state));
    const getMessage = useAppSelector(state => state.getMessage);
    const {preventInput} = props;

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
                    buffer='printerLibTestInput'
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
}
