import {Button, ControlGroup, Dialog, FormGroup, InputGroup} from "@blueprintjs/core";
import React, {useRef, useState} from "react";
import {getMessage} from "../lang";
import {IconNames} from '@blueprintjs/icons';
import {useAppSelector} from '../hooks';
import {selectActiveBufferPlatform} from '../buffers/buffer_selectors';
import {platformsList} from '../stepper/platforms';

interface LocalWorkDialogProps {
    open: boolean,
    onClose: () => void,
}

export function LocalWorkDialog(props: LocalWorkDialogProps) {
    const taskToken = useAppSelector(state => state.platform.taskToken);
    const platformName = useAppSelector(state => state.platform.platformName);
    const platform = useAppSelector(selectActiveBufferPlatform);
    const shellCommand = `fioi submit code.${platformsList[platform].extension} --platform ${platformName} --token ${taskToken}`;
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const handleFocus = (event) => event.target.select();

    const copyCommand = () => {
        navigator.clipboard.writeText(shellCommand);
        setCopied(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <Dialog
            icon="menu"
            title={getMessage('MENU_LOCAL')}
            isOpen={props.open}
            onClose={props.onClose}
            canEscapeKeyClose={true}
            canOutsideClickClose={true}
            isCloseButtonShown={true}
        >
            <div className='bp4-dialog-body'>
                <FormGroup labelFor='shellCommand' label={getMessage('LOCAL_WORK_URL')}>
                    <ControlGroup>
                        <InputGroup
                            leftIcon={IconNames.Console}
                            type='text'
                            value={shellCommand}
                            readOnly
                            onFocus={handleFocus}
                        />
                        <Button icon={copied ? 'tick' : 'duplicate'} onClick={copyCommand} />
                        {copied && <div className="ml-1" style={{fontSize: '0.85rem', display: 'flex', alignItems: 'center'}}>
                            {getMessage('COPIED')}
                        </div>}
                    </ControlGroup>
                </FormGroup>
            </div>
        </Dialog>
    );
}
