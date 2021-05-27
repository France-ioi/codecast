import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {initialStateTerminal, TermBuffer} from "../../../stepper/io/terminal";

export interface PrinterTerminalState {
    terminal: any,
    terminalElement: any,
    inputBuffer: any,
}

export const printerTerminalSlice = createSlice({
    name: 'printerTerminal',
    initialState: {
        terminal: new TermBuffer({lines: 10, width: 80}),
        terminalElement: null,
        inputBuffer: '',
    } as PrinterTerminalState,
    reducers: {
        terminalInit(state, action: PayloadAction<any>) {
            state.terminal = new TermBuffer({lines: 10, width: 80});
            if (action.payload) {
                state.terminalElement = action.payload;
            }
        },
        terminalInputKey(state, action: PayloadAction<string>) {
            state.inputBuffer = state.inputBuffer + action.payload;
        },
        terminalInputBackSpace(state) {
            state.inputBuffer = state.inputBuffer.slice(0, -1);
        },
    },
});

export const {
    terminalInit,
    terminalInputKey,
    terminalInputBackSpace,
} = printerTerminalSlice.actions;

export const taskRecordableActions = [
    // 'terminalInputKey',
    // 'terminalInputBackSpace',
];

export default printerTerminalSlice;
