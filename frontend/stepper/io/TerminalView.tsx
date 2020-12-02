import React from "react";
import {Panel} from 'react-bootstrap';
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
    input?: string
}

function mapStateToProps(state: AppStore): TerminalViewStateToProps {
    const stepper = getCurrentStepperState(state);
    if (stepper) {
        return {
            terminal: stepper.terminal,
            input: stepper.inputBuffer,
            isWaitingOnInput: stepper.isWaitingOnInput
        }
    }

    return {};
}

interface TerminalViewDispatchToProps {
    dispatch: Function
}

interface TerminalViewProps extends TerminalViewStateToProps, TerminalViewDispatchToProps {
    preventInput: boolean
}

class _TerminalView extends React.PureComponent<TerminalViewProps> {
    onTermInit = (iface) => {
        this.props.dispatch({type: ActionTypes.TerminalInit, iface});
    };
    onTermChar = (key) => {
        if (!this.props.preventInput) {
            this.props.dispatch({type: ActionTypes.TerminalInputKey, key});
        }
    };
    onTermBS = () => {
        if (!this.props.preventInput) {
            this.props.dispatch({type: ActionTypes.TerminalInputBackspace});
        }
    };
    onTermEnter = () => {
        if (!this.props.preventInput) {
            this.props.dispatch({type: ActionTypes.TerminalInputEnter});
        }
    };
    renderHeader = () => {
        const {isWaitingOnInput} = this.props;

        return (
            <div className="row">
                <div className="col-sm-12">
                    {'Terminal'}
                    {isWaitingOnInput &&
                    <Icon icon='console'/>}
                </div>
            </div>
        );
    };

    render() {
        const {terminal, input} = this.props;
        const buffer = terminal && writeString(terminal, input);

        return (
            <Panel>
                <Panel.Heading>{this.renderHeader()}</Panel.Heading>
                <Panel.Body>
                    <div className="row">
                        <div className="col-sm-12">
                            {buffer ?
                                <PureTerminal
                                    buffer={buffer}
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
                </Panel.Body>
            </Panel>
        );
    }
}

export const TerminalView = connect(mapStateToProps)(_TerminalView);
