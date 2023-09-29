import React, {useRef} from "react";
import {TerminalView} from "./TerminalView";
import {InputOutputView} from "./InputOutputView";
import {IoMode} from "../../../stepper/io";
import {useAppSelector} from "../../../hooks";
import {getMessage} from "../../../lang";
import {selectCurrentTest} from '../../task_slice';

export function InputOutputVisualization() {
    const ioMode = useAppSelector(state => state.options.ioMode);
    const currentTest = useAppSelector(selectCurrentTest);
    const currentTestData = currentTest?.data;

    const currentTestDataRef = useRef<any>();
    currentTestDataRef.current = currentTestData;

    let visualization;
    if (IoMode.Terminal === ioMode) {
        visualization = <TerminalView/>;
    } else if (IoMode.Split === ioMode) {
        visualization = <InputOutputView/>;
    } else {
        visualization = <p>{getMessage('IOPANE_TERMINAL_PROGRAM_STOPPED')}</p>;
    }

    return <div className="io-visualization">{visualization}</div>
}
