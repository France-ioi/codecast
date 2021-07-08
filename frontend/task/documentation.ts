import {Bundle} from "../linker";
import {put, select, takeEvery} from "redux-saga/effects";
import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {extractLevelSpecific} from "./utils";
import {DocumentationConcept, documentationConceptSelected, documentationConceptsLoaded} from "./documentation_slice";
import {taskLevels} from "./task_slice";

export enum DocumentationActionTypes {
    DocumentationLoad = 'documentation/load',
}

export interface ConceptViewer {
    loadConcepts: Function,
}

export const documentationLoad = () => ({
    type: DocumentationActionTypes.DocumentationLoad,
});

function* documentationLoadSaga() {
    const context = quickAlgoLibraries.getContext();
    if (context.display && context.infos.conceptViewer) {
        const conceptViewer = context.infos.conceptViewer;
        let allConcepts = context.getConceptList();
        allConcepts = allConcepts.concat(window.getConceptViewerBaseConcepts());

        const currentLevel = yield select(state => state.task.currentLevel);
        const getMessage = yield select(state => state.getMessage);
        const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, taskLevels[currentLevel]);

        let concepts = window.getConceptsFromBlocks(curIncludeBlocks, allConcepts, context);
        if (conceptViewer.length) {
            concepts = concepts.concat(conceptViewer);
        } else {
            concepts.push('base');
        }

        const taskConcept = {
            id: 'task-instructions',
            name: getMessage('TASK_DOCUMENTATION_INSTRUCTIONS'),
        };

        const documentationConcepts: DocumentationConcept[] = window.conceptsFill(concepts, allConcepts);
        const documentationConceptsWithTask: DocumentationConcept[] = [
            taskConcept,
            ...documentationConcepts,
        ];

        yield put(documentationConceptsLoaded(documentationConceptsWithTask));

        const selectedConceptId = yield select(state => state.documentation.selectedConceptId);
        if (concepts.length && (!selectedConceptId || !documentationConceptsWithTask.find(concept => selectedConceptId === concept.id))) {
            yield put(documentationConceptSelected(documentationConceptsWithTask[0].id));
        }
    }
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield takeEvery(DocumentationActionTypes.DocumentationLoad, documentationLoadSaga);
    });
}
