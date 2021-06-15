import React, {useEffect, useRef} from "react";
import {TermBuffer} from "../../../stepper/io/terminal";

interface PureTerminalProps {
    onInit: Function,
    onBackspace: Function,
    onEnter: Function,
    onKeyPress: Function,
    terminalBuffer: TermBuffer
}

export function PureTerminal(props: PureTerminalProps) {
    const refTerminal = useRef<HTMLDivElement>();

    useEffect(() => {
        props.onInit({
            focus: () => refTerminal.current.focus()
        });
    }, []);

    const onKeyDown = (event) => {
        event.stopPropagation();
        refTerminal.current.focus();
        let block = false;
        switch (event.keyCode) {
            case 8:
                block = true;
                props.onBackspace();
                break;
            case 13:
                block = true;
                props.onEnter();
                break;
        }
        if (block) {
            event.preventDefault();
        }
    };

    const onKeyUp = (event) => {
        event.stopPropagation();
        event.preventDefault();
    };

    const onKeyPress = (event) => {
        event.stopPropagation();
        event.preventDefault();
        props.onKeyPress(event.key);
    };

    const {terminalBuffer} = props;
    const cursor = terminalBuffer.cursor;
    const ci = cursor.line, cj = cursor.column;

    return (
        <div ref={refTerminal} className="terminal" tabIndex={1} onKeyDown={onKeyDown}
             onKeyUp={onKeyUp} onKeyPress={onKeyPress}>
            {terminalBuffer.lines.map(function(line, i) {
                return (
                    <div key={i} className="terminal-line" style={{width: '100%'}}>
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
