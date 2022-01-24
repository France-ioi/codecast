import React, {useEffect, useRef} from "react";

interface PureTerminalProps {
    onInit: Function,
    onBackspace: Function,
    onEnter: Function,
    onKeyPress: Function,
    terminalContent: string,
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

    const {terminalContent} = props;

    useEffect(() => {
        const terminal = refTerminal.current;
        terminal.scrollTop = terminal.scrollHeight;
    }, [terminalContent]);

    const lines = terminalContent.split("\n");

    return (
        <div
            ref={refTerminal}
            className="terminal"
            tabIndex={1}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onKeyPress={onKeyPress}
        >
            {lines.map((line, i) =>
                <div key={i} className="terminal-line" style={{width: '100%'}}>
                    {line}
                    {i === lines.length - 1 && <span className="terminal-cursor">&nbsp;</span>}
                </div>
            )}
        </div>
    );
}
