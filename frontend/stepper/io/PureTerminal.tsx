import React from "react";

interface PureTerminalProps {
    onInit: Function,
    onBackspace: Function,
    onEnter: Function,
    onKeyPress: Function,
    buffer: any
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
        const {buffer} = this.props;
        const cursor = buffer.get('cursor');
        const ci = cursor.get('line'), cj = cursor.get('column');
        return (
            <div ref={this.refTerminal} className="terminal" tabIndex={1} onKeyDown={this.onKeyDown}
                 onKeyUp={this.onKeyUp} onKeyPress={this.onKeyPress}>
                {buffer.get('lines').map(function(line, i) {
                    return (
                        <div key={i} className="terminal-line" style={{width: '720px'}}>
                            {line.map(function(cell, j) {
                                if (i == ci && j == cj) {
                                    return <span key={j} className="terminal-cursor">{cell.get('char')}</span>;
                                }
                                return <span key={j}>{cell.get('char')}</span>;
                            })}
                        </div>
                    );
                })}
            </div>
        );
    }
}
