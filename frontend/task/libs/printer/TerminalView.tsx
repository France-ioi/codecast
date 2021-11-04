import React, {useEffect, useRef, useState} from "react";
import {Card} from 'react-bootstrap';
import {Icon} from "@blueprintjs/core";
import {TermBuffer, writeString} from "../../../stepper/io/terminal";
import {PureTerminal} from "./PureTerminal";
import {useDispatch} from "react-redux";
import {AppStore} from "../../../store";
import {useAppSelector} from "../../../hooks";
import {getPlayerState} from "../../../player/selectors";
import {
    getTerminalText,
    printerLibTerminalInputBackSpace,
    printerLibTerminalInputEnter,
    printerLibTerminalInputKey
} from "./printer_lib";

export function TerminalView() {
    const getMessage = useAppSelector((state: AppStore) => state.getMessage);
    const taskState = useAppSelector((state: AppStore) => state.task.state);
    const input = taskState ? taskState.inputBuffer : '';
    const inputNeeded = useAppSelector((state: AppStore) => state.task.inputNeeded);
    const player = useAppSelector((state: AppStore) => getPlayerState(state));
    const preventInput = player && player.isPlaying;

    let terminalBuffer = new TermBuffer({lines: 10, width: 60});
    if (taskState && taskState.events) {
        terminalBuffer = writeString(terminalBuffer, getTerminalText(taskState.events));
    }
    terminalBuffer = writeString(terminalBuffer, input);

    const [focus, setFocus] = useState(null);

    const dispatch = useDispatch();

    useEffect(() => {
        if (inputNeeded && focus) {
            focus();
        }
    }, [inputNeeded])

    const onTermInit = (terminalElement) => {
        setFocus(() => terminalElement.focus);
    }

    const onTermChar = (key) => {
        if (!preventInput) {
            dispatch(printerLibTerminalInputKey(key));
        }
    }

    const onTermBS = () => {
        if (!preventInput) {
            dispatch(printerLibTerminalInputBackSpace());
        }
    }

    const onTermEnter = () => {
        if (!preventInput) {
            dispatch(printerLibTerminalInputEnter());
        }
    }

    const renderHeader = () => {
        return (
            <div className="row">
                <div className="col-sm-12 terminal-view-header">
                    {getMessage('IOPANE_TERMINAL')}
                    {inputNeeded &&
                        <Icon icon='console'/>
                    }
                </div>
            </div>
        );
    }

    return (
        <Card>
            <Card.Header>{renderHeader()}</Card.Header>
            <Card.Body>
                <div className="row">
                    <div className="col-sm-12">
                        {terminalBuffer ?
                            <PureTerminal
                                terminalBuffer={terminalBuffer}
                                onInit={onTermInit}
                                onKeyPress={onTermChar}
                                onBackspace={onTermBS}
                                onEnter={onTermEnter}
                            />
                        :
                            <p>{"no buffer"}</p>
                        }
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
