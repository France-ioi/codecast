import {Dialog} from "@blueprintjs/core";
import React from "react";
import {useAppSelector} from "../hooks";
import {EditorOverview} from "./EditorOverview";

interface EditRecordingDialogProps {
    open: boolean,
    onClose: () => void,
}

export function EditRecordingDialog(props: EditRecordingDialogProps) {
    const getMessage = useAppSelector(state => state.getMessage);

    return (
        <Dialog icon='menu' title={getMessage('MENU_EDIT_RECORDING')} isOpen={props.open} onClose={props.onClose} className="edit-recording-dialog">
            <div className='bp3-dialog-body'>
                <EditorOverview
                    withoutWaveform
                />
            </div>
        </Dialog>
    );
}
