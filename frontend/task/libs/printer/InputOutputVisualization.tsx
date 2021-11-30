import React from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {getCurrentStepperState} from "../../../stepper/selectors";
import {IoMode} from "../../../stepper/io";
import {BufferEditor} from "../../../buffers/BufferEditor";
import {useAppSelector} from "../../../hooks";
import {inputBufferLibTest, outputBufferLibTest} from "./printer_lib";

export function InputOutputVisualization() {
    const ioMode = useAppSelector(state => state.ioPane.mode);
    const hasStepper = useAppSelector(state => !!getCurrentStepperState(state) || !state.task.resetDone);
    const getMessage = useAppSelector(state => state.getMessage);

    if (hasStepper) {
        if (IoMode.Terminal === ioMode) {
            return <TerminalView/>;
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
                    buffer={inputBufferLibTest}
                    mode='text'
                    requiredWidth='100%'
                    requiredHeight='150px'
                />

                <p className="mt-4">{getMessage('IOPANE_INITIAL_OUTPUT')}</p>
                <BufferEditor
                    buffer={outputBufferLibTest}
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
