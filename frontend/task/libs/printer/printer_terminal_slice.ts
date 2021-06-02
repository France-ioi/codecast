import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {TermBuffer, writeString} from "../../../stepper/io/terminal";

export interface PrinterTerminalState {
    terminal: TermBuffer,
    terminalElement: any,
    inputBuffer: string,
    lastInput: string,
}

export const printerTerminalInitialState = {
    terminal: new TermBuffer({lines: 10, width: 60}),
    terminalElement: null,
    inputBuffer: '',
    lastInput: '',
} as PrinterTerminalState;

export const printerTerminalSlice = createSlice({
    name: 'printerTerminal',
    initialState: printerTerminalInitialState,
    reducers: {
        terminalInit(state, action: PayloadAction<any>) {
            state.terminal = new TermBuffer({lines: 10, width: 60});
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
        terminalFocus(state) {
            if (state.terminalElement) {
                state.terminalElement.focus();
            }
        },
        terminalInputEnter(state) {
            console.log('terminal input enter');
            const inputLine = state.inputBuffer + '\n';
            state.terminal = writeString(state.terminal, inputLine);
            state.lastInput = state.inputBuffer;
            state.inputBuffer = '';
            // state.stepper.currentStepperState.isWaitingOnInput = false;
        },
        terminalPrintLine(state, action: PayloadAction<string>) {
            state.terminal = writeString(state.terminal, action.payload);
        },
    },
});

export const {
    terminalInit,
    terminalInputKey,
    terminalInputBackSpace,
    terminalFocus,
    terminalInputEnter,
    terminalPrintLine,
} = printerTerminalSlice.actions;

export const printerTerminalRecordableActions = [
    'terminalInputKey',
    'terminalInputBackSpace',
    'terminalFocus',
];

export default printerTerminalSlice;
