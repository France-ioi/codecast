import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface DocumentationConcept {
    id: string,
    name: string,
    url: string,
    isBase?: boolean,
    order?: number,
    python?: boolean,
}

export interface DocumentationState {
    concepts?: DocumentationConcept[],
    selectedConceptId?: string,
}

export const documentationInitialState = {
    concepts: [],
    selectedConcept: null,
} as DocumentationState;

export const documentationSlice = createSlice({
    name: 'documentation',
    initialState: documentationInitialState,
    reducers: {
        documentationConceptsLoaded(state, action: PayloadAction<DocumentationConcept[]>) {
            state.concepts = action.payload;
        },
        documentationConceptSelected(state, action: PayloadAction<string>) {
            state.selectedConceptId = action.payload;
        },
    },
});

export const {
    documentationConceptsLoaded,
    documentationConceptSelected,
} = documentationSlice.actions;

export default documentationSlice;
