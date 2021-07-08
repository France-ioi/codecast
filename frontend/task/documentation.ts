import {Bundle} from "../linker";
import {App} from "../index";
import {all, call, fork, put, select, takeEvery} from "redux-saga/effects";
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
        console.log('all concepts', allConcepts);

        const currentLevel = yield select(state => state.task.currentLevel);
        const curIncludeBlocks = extractLevelSpecific(context.infos.includeBlocks, taskLevels[currentLevel]);

        let concepts = window.getConceptsFromBlocks(curIncludeBlocks, allConcepts, context);
        if (conceptViewer.length) {
            concepts = concepts.concat(conceptViewer);
        } else {
            concepts.push('base');
        }

        const documentationConcepts: DocumentationConcept[] = window.conceptsFill(concepts, allConcepts);

        yield put(documentationConceptsLoaded(documentationConcepts));

        if (concepts.length) {
            yield put(documentationConceptSelected(documentationConcepts[0].id));
        }
    }
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        yield takeEvery(DocumentationActionTypes.DocumentationLoad, documentationLoadSaga);
    });
}
