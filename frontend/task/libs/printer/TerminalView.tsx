import React from "react";
import {Card} from 'react-bootstrap';
import {Icon} from "@blueprintjs/core";
import {writeString} from "../../../stepper/io/terminal";
import {PureTerminal} from "./PureTerminal";
import {useDispatch} from "react-redux";
import {AppStore} from "../../../store";
import {useAppSelector} from "../../../hooks";
import {
    terminalInitElement,
    terminalInputBackSpace,
    terminalInputEnter,
    terminalInputKey
} from "./printer_terminal_slice";
import {getPlayerState} from "../../../player/selectors";

export function TerminalView() {
    const getMessage = useAppSelector((state: AppStore) => state.getMessage);
    let input = useAppSelector((state: AppStore) => state.printerTerminal.inputBuffer);
    let terminal = useAppSelector((state: AppStore) => state.printerTerminal.terminal);
    let inputNeeded = useAppSelector((state: AppStore) => state.task.inputNeeded);

    const player = useAppSelector((state: AppStore) => getPlayerState(state));
    const preventInput = player && player.isPlaying;

    const dispatch = useDispatch();

    const onTermInit = (terminalElement) => {
        dispatch(terminalInitElement(terminalElement));
    }

    const onTermChar = (key) => {
        if (!preventInput) {
            dispatch(terminalInputKey(key));
        }
    }

    const onTermBS = () => {
        if (!preventInput) {
            dispatch(terminalInputBackSpace());
        }
    }

    const onTermEnter = () => {
        if (!preventInput) {
            dispatch(terminalInputEnter());
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

    const terminalBuffer = terminal && writeString(terminal, input);

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
