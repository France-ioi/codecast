import {Dialog} from "@blueprintjs/core";
import React, {useEffect} from "react";
import {EditorSave} from "./EditorSave";
import {useDispatch} from "react-redux";
import {ActionTypes} from './actionTypes';
import {getMessage} from "../lang";

interface EditRecordingDialogProps {
    open: boolean,
    onClose: () => void,
}

export function EditRecordingDialog(props: EditRecordingDialogProps) {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({type: ActionTypes.EditorSaveClear});
    }, []);

    return (
        <Dialog icon='menu' title={getMessage('MENU_EDIT_RECORDING_TITLE')} isOpen={props.open} onClose={props.onClose} className="edit-recording-dialog">
            <div className='bp4-dialog-body'>
                <EditorSave/>
            </div>
        </Dialog>
    );
}
