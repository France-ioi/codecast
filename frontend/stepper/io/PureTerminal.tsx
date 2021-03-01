import React from "react";
import {TermBuffer} from "./terminal";

interface PureTerminalProps {
    onInit: Function,
    onBackspace: Function,
    onEnter: Function,
    onKeyPress: Function,
    terminalBuffer: TermBuffer
}

export class PureTerminal extends React.PureComponent<PureTerminalProps> {
    terminalElement: HTMLDivElement = null;

    refTerminal = (element) => {
        this.terminalElement = element;
        this.props.onInit(element && {
            focus: () => element.focus()
        });
    };

    onKeyDown = (event) => {
        event.stopPropagation();
        this.terminalElement.focus();
        let block = false;
        switch (event.keyCode) {
            case 8:
                block = true;
                this.props.onBackspace();
                break;
            case 13:
                block = true;
                this.props.onEnter();
                break;
        }
        if (block) {
            event.preventDefault();
        }
    };

    onKeyUp = (event) => {
        event.stopPropagation();
        event.preventDefault();
    };

    onKeyPress = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.onKeyPress(event.key);
    };

    render() {
        const {terminalBuffer} = this.props;
        const cursor = terminalBuffer.cursor;
        const ci = cursor.line, cj = cursor.column;
        return (
            <div ref={this.refTerminal} className="terminal" tabIndex={1} onKeyDown={this.onKeyDown}
                 onKeyUp={this.onKeyUp} onKeyPress={this.onKeyPress}>
                {terminalBuffer.lines.map(function(line, i) {
                    return (
                        <div key={i} className="terminal-line" style={{width: '720px'}}>
                            {line.map(function(cell, j) {
                                if (i == ci && j == cj) {
                                    return <span key={j} className="terminal-cursor">{cell.char}</span>;
                                }

                                return <span key={j}>{cell.char}</span>;
                            })}
                        </div>
                    );
                })}
            </div>
        );
    }
}
