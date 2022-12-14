import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface ModalState extends PromptModalOptions {
    open: boolean,
    id: number,
}

export const modalInitialState: ModalState = {
    open: false,
    id: 0,
};

export enum ModalType {
    input = 'input',
    message = 'message',
    dialog = 'dialog',
    keypad = 'keypad',
}

export interface PromptModalOptions {
    message?: string,
    defaultInput?: string,
    yesButtonText?: string,
    noButtonText?: string,
    callback?: Function,
    mode?: ModalType,
    position?: any,
    callbackModify?: Function, // for keypad
    callbackFinished?: Function, // for keypad
    options?: any, // for keypad
}

export const modalSlice = createSlice({
    name: 'modal',
    initialState: modalInitialState,
    reducers: {
        modalShow(state, action: PayloadAction<PromptModalOptions>) {
            state.open = true;
            state.id++;
            state.message = action.payload.message;
            state.mode = action.payload.mode;
            state.yesButtonText = action.payload.yesButtonText;
            state.noButtonText = action.payload.noButtonText;
            state.defaultInput = action.payload.defaultInput;
            state.callback = action.payload.callback;
            state.position = action.payload.position;
            state.callbackModify = action.payload.callbackModify;
            state.callbackFinished = action.payload.callbackFinished;
            state.options = action.payload.options;
        },
        modalHide(state) {
            state.open = false;
        },
    },
});

export const {
    modalShow,
    modalHide,
} = modalSlice.actions;

export default modalSlice;
