import React from "react";
import {Card} from 'react-bootstrap';
import {Icon} from "@blueprintjs/core";
import {writeString} from "../../../stepper/io/terminal";
import {ActionTypes} from "../../../stepper/io/actionTypes";
import {PureTerminal} from "./PureTerminal";
import {getCurrentStepperState} from "../../../stepper/selectors";
import {useDispatch} from "react-redux";
import {AppStore} from "../../../store";
import {useAppSelector} from "../../../hooks";
import {terminalInit, terminalInputBackSpace, terminalInputKey} from "./printer_terminal_slice";

interface TerminalViewProps {
    preventInput: boolean
}

export function TerminalView(props: TerminalViewProps) {
    const getMessage = useAppSelector((state: AppStore) => state.getMessage);
    const stepper = useAppSelector((state: AppStore) => getCurrentStepperState(state));
    let isWaitingOnInput = false;
    let input = useAppSelector((state: AppStore) => state.printerTerminal.inputBuffer);
    let terminal = useAppSelector((state: AppStore) => state.printerTerminal.terminal);
    if (stepper) {
        isWaitingOnInput = stepper.isWaitingOnInput;
    }

    const dispatch = useDispatch();

    const onTermInit = (terminalElement) => {
        dispatch(terminalInit(terminalElement));
    }

    const onTermChar = (key) => {
        if (!props.preventInput) {
            dispatch(terminalInputKey(key));
        }
    }

    const onTermBS = () => {
        if (!props.preventInput) {
            dispatch(terminalInputBackSpace());
        }
    }

    const onTermEnter = () => {
        if (!props.preventInput) {
            dispatch({type: ActionTypes.TerminalInputEnter});
        }
    }

    const renderHeader = () => {
        return (
            <div className="row">
                <div className="col-sm-12 terminal-view-header">
                    {getMessage('IOPANE_TERMINAL')}
                    {isWaitingOnInput &&
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
