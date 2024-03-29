import {Checkbox, Dialog, Icon, Radio} from "@blueprintjs/core";
import React, {useCallback, useEffect, useState} from "react";
import log from 'loglevel';

export function DebugDialog() {
    const [isOpen, setOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    let lastTyped = [];
    const debugCode = "17931793";

    const handleUserKeyPress = useCallback(e => {
        lastTyped.push(e.key);
        lastTyped = lastTyped.slice(Math.max(0, lastTyped.length - debugCode.length), lastTyped.length);
        if (debugCode === lastTyped.join('')) {
            setOpen(true);
        }
    }, []);

    const onChangeLevel = useCallback((name: string, enabled) => {
        log.getLogger(name).setLevel(enabled ? 1 : 2);
        setRefreshTrigger(ref => ref + 1);
    }, []);

    useEffect(() => {
        window.addEventListener('keypress', handleUserKeyPress);

        return () => {
            window.removeEventListener("keydown", handleUserKeyPress);
        };
    }, [handleUserKeyPress]);

    return (
        <Dialog
            isOpen={isOpen}
            className={`simple-dialog`}
            canOutsideClickClose
            canEscapeKeyClose
            onClose={() => setOpen(false)}
        >
            <div className='bp4-dialog-body'>
                <h1 className="mb-4">Choose which log levels to enable:</h1>

                {Object.entries(log.getLoggers()).map(([name, logger]) =>
                    <label style={{display: 'flex', cursor: 'pointer'}} key={name}>
                        <span className="mr-2">{name}</span>
                        <Checkbox checked={logger.getLevel() === 1} onChange={() => onChangeLevel(name, logger.getLevel() !== 1)}/>
                    </label>
                )}
            </div>
        </Dialog>
    );
}
