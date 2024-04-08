import {AnchorButton, Dialog, FormGroup, InputGroup} from "@blueprintjs/core";
import React from "react";
import {getMessage} from "../lang";
import {IconNames} from '@blueprintjs/icons';
import {useAppSelector} from '../hooks';

interface LocalWorkDialogProps {
    open: boolean,
    onClose: () => void,
}

export function LocalWorkDialog(props: LocalWorkDialogProps) {
    const taskToken = useAppSelector(state => state.platform.taskToken);
    const shellCommand = `fioi submit file.py ${taskToken}`
    const handleFocus = (event) => event.target.select();

    return (
        <Dialog
            icon='code'
            title={getMessage('MENU_LOCAL')}
            isOpen={props.open}
            onClose={props.onClose}
            canEscapeKeyClose={true}
            canOutsideClickClose={true}
            isCloseButtonShown={true}
        >
            <div className='bp4-dialog-body'>
                <FormGroup labelFor='shellCommand' label={getMessage('EDITOR_LINK')} className="mt-4">
                    <InputGroup
                        leftIcon={IconNames.LINK}
                        type='text'
                        value={shellCommand}
                        readOnly
                        onFocus={handleFocus}
                    />
                </FormGroup>
            </div>
        </Dialog>
    );
}
