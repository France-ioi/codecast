import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export const printerSlice = createSlice({
    name: 'libs/printer',
    initialState: {
        input_text: '',
        output_text: '',
        input_reset: true,
    },
    reducers: {
        updateInput(state, action: PayloadAction<string>) {
            state.input_text = action.payload;
        },
    }
});

export const {
    updateInput,
} = printerSlice.actions;

export default printerSlice.reducer;
