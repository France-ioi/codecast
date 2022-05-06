import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface ModalState extends PromptModalOptions {
    open: boolean,
}

export const modalInitialState: ModalState = {
    open: false,
};

export enum ModalType {
    input = 'input',
    message = 'message',
}

export interface PromptModalOptions {
    message?: string,
    defaultInput?: string,
    noButtonText?: string,
    callback?: Function,
    mode?: ModalType,
}

export const modalSlice = createSlice({
    name: 'modal',
    initialState: modalInitialState,
    reducers: {
        modalShow(state, action: PayloadAction<PromptModalOptions>) {
            state.open = true;
            state.message = action.payload.message;
            state.mode = action.payload.mode;
            state.noButtonText = action.payload.noButtonText;
            state.defaultInput = action.payload.defaultInput;
            state.callback = action.payload.callback;
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
