import React from "react";
import {Card} from 'react-bootstrap';
import {Icon} from "@blueprintjs/core";
import {writeString} from "./terminal";
import {ActionTypes} from "./actionTypes";
import {PureTerminal} from "./PureTerminal";
import {getCurrentStepperState} from "../selectors";
import {connect} from "react-redux";
import {AppStore} from "../../store";

interface TerminalViewStateToProps {
    isWaitingOnInput?: boolean,
    terminal?: any,
    input?: string,
    getMessage: Function,
}

function mapStateToProps(state: AppStore): TerminalViewStateToProps {
    const stepper = getCurrentStepperState(state);
    if (stepper) {
        return {
            getMessage: state.getMessage,
            terminal: stepper.terminal,
            input: stepper.inputBuffer,
            isWaitingOnInput: stepper.isWaitingOnInput
        }
    }

    return {
        getMessage: state.getMessage,
    };
}

interface TerminalViewDispatchToProps {
    dispatch: Function
}

interface TerminalViewProps extends TerminalViewStateToProps, TerminalViewDispatchToProps {
    preventInput: boolean
}

class _TerminalView extends React.PureComponent<TerminalViewProps> {
    onTermInit = (terminalElement) => {
        this.props.dispatch({type: ActionTypes.TerminalInit, terminalElement});
    }

    onTermChar = (key) => {
        if (!this.props.preventInput) {
            this.props.dispatch({type: ActionTypes.TerminalInputKey, key});
        }
    }

    onTermBS = () => {
        if (!this.props.preventInput) {
            this.props.dispatch({type: ActionTypes.TerminalInputBackspace});
        }
    }

    onTermEnter = () => {
        if (!this.props.preventInput) {
            this.props.dispatch({type: ActionTypes.TerminalInputEnter});
        }
    }

    renderHeader = () => {
        const {isWaitingOnInput, getMessage} = this.props;

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

    render = () => {
        const {terminal, input} = this.props;
        const terminalBuffer = terminal && writeString(terminal, input);

        return (
            <Card>
                <Card.Header>{this.renderHeader()}</Card.Header>
                <Card.Body>
                    <div className="row">
                        <div className="col-sm-12">
                            {terminalBuffer ?
                                <PureTerminal
                                    terminalBuffer={terminalBuffer}
                                    onInit={this.onTermInit}
                                    onKeyPress={this.onTermChar}
                                    onBackspace={this.onTermBS}
                                    onEnter={this.onTermEnter}
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
}

export const TerminalView = connect(mapStateToProps)(_TerminalView);
