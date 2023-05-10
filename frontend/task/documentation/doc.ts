import {Bundle} from "../../linker";
import {call, put, takeEvery} from "typed-redux-saga";
import {quickAlgoLibraries} from "../libs/quickalgo_libraries";
import {
    DocumentationConcept,
    documentationConceptSelected,
    documentationConceptsLoaded,
    DocumentationLanguage,
    documentationLanguageChanged
} from "./documentation_slice";
import {ActionTypes, ActionTypes as CommonActionTypes} from "../../common/actionTypes";
import {getMessage} from "../../lang";
import {App} from "../../index";
import {Screen} from "../../common/screens";
import {appSelect} from '../../hooks';
import {CodecastPlatform} from '../../stepper/platforms';
import {QuickalgoTaskIncludeBlocks, Task, TaskActionTypes, taskSetAvailablePlatforms} from '../task_slice';
import {getNotionsBagFromIncludeBlocks, NotionArborescence} from '../blocks/notions';
import {createAction} from '@reduxjs/toolkit';
import {documentModelFromString} from '../../buffers';
import {ActionTypes as BufferActionTypes} from "../../buffers/actionTypes";

let openerChannel;

export interface ConceptViewer {
    showConcept: Function,
}

export const documentationLoad = createAction('documentation/load', (standalone: boolean, hasTaskInstructions?: boolean) => ({
    payload: {
        standalone,
        hasTaskInstructions: true === hasTaskInstructions,
    },
}));

export const documentationOpenInNewWindow = createAction('documentation/openInNewWindow', (hasTaskInstructions: boolean) => ({
    payload: {
        hasTaskInstructions,
    },
}));

export const documentationUseCodeExample = createAction('documentation/useCodeExample', (code: string, language: DocumentationLanguage) => ({
    payload: {
        code,
        language,
    },
}));

function getConceptsFromChannel() {
    return new Promise<{concepts: any, selectedConceptId: number, availablePlatforms: CodecastPlatform[], screen: string, language: DocumentationLanguage}>((resolve, reject) => {
        if (!openerChannel) {
            openerChannel = window.Channel.build({window: window.opener, origin: '*', scope: 'test'});
        }

        openerChannel.call({
            method: 'getConceptViewerConfigs',
            timeout: 100,
            success: function (configs) {
                resolve(configs);
            },
            error: function (err) {
                reject(err);
            }
        });
    })
}

export function sendCodeExampleToOpener(code, language) {
    if (!openerChannel) {
        openerChannel = window.Channel.build({window: window.opener, origin: '*', scope: 'test'});
    }

    openerChannel.call({
        method: 'useCodeExample',
        params: {
            code,
            language,
        },
        success: function () {
        },
        error: function () {
        }
    });
}

export function convertPlatformToDocumentationLanguage(platform: CodecastPlatform): DocumentationLanguage {
    if (CodecastPlatform.Unix === platform || CodecastPlatform.Arduino === platform) {
        return DocumentationLanguage.C;
    } else {
        return platform as unknown as DocumentationLanguage;
    }
}

// Extracted from _common/modules/pemFioi/conceptViewer-1.0-mobileFirst.js
function getConceptsFromBlocks(includeBlocks: QuickalgoTaskIncludeBlocks, allConcepts, notionsList: NotionArborescence) {
    if (!includeBlocks) {
        return [];
    }

    let concepts = ['language'];
    let blocklyAliases = {
        'controls_repeat_ext': 'controls_repeat'
    };

    const allConceptsById = {};
    for (let c = 0; c < allConcepts.length; c++) {
        allConceptsById[allConcepts[c].id] = allConcepts[c];
    }

    const notionsBag = getNotionsBagFromIncludeBlocks(includeBlocks, notionsList);
    for (let notion of notionsBag.getNotionsList()) {
        let notionRealName = notion in blocklyAliases ? blocklyAliases[notion] : notion;
        if (allConceptsById['blockly_' + notionRealName]) {
            concepts.push(allConceptsById['blockly_' + notionRealName]);
        } else if (allConceptsById[notionRealName]) {
            concepts.push(allConceptsById[notionRealName]);
        }
    }

    // Ole code, useful for QuickPi
    if (includeBlocks.generatedBlocks) {
        for (let genName in includeBlocks.generatedBlocks) {
            // this variable is used in order to make sure that we don't include two
            // times a documentation
            let includedConceptIds = [];
            // We remove all concepts which have no "python" attribute
            let filteredConcepts = allConcepts.filter(function (concept) {
                return concept.python && concept.python != [];
            });
            for (let functionKey in includeBlocks.generatedBlocks[genName]) {
                let functionName = includeBlocks.generatedBlocks[genName][functionKey];
                let concept = findConceptByFunction(filteredConcepts, functionName);
                if (concept) {
                    // if we does not have the concept already pushed, we push it.
                    if (includedConceptIds.indexOf(concept.id) == -1) {
                        includedConceptIds.push(concept.id);
                        concepts.push(concept);
                    }
                }
            }
        }
    }

    return concepts;
}

function findConceptByFunction(filteredConcepts, functionName) {
    for (let conceptId in filteredConcepts) {
        for (let conceptFunctionId in filteredConcepts[conceptId].python) {
            if (filteredConcepts[conceptId].python[conceptFunctionId] === functionName) {
                return filteredConcepts[conceptId];
            }
        }
    }

    return false;
}

function getConceptsFromLanguage(hasTaskInstructions: boolean, currentTask: Task|null, language: DocumentationLanguage) {
    let context = quickAlgoLibraries.getContext(null, 'main');
    if (context.infos.conceptViewer) {
        let concepts = [], allConcepts = [];
        if (DocumentationLanguage.C !== language) {
            allConcepts = context.getConceptList();
            allConcepts = allConcepts.concat(window.getConceptViewerBaseConcepts());
            concepts = getConceptsFromBlocks(context.infos.includeBlocks, allConcepts, context.getNotionsList());
        }

        const conceptViewer = context.infos.conceptViewer;
        if (Array.isArray(conceptViewer)) {
            concepts = concepts.concat(conceptViewer);
        } else {
            concepts.push('base');
        }

        if (!currentTask) {
            // Add code examples to documentation
            const conceptBaseUrl = (window.location.protocol == 'https:' ? 'https:' : 'http:') + '//'
                + 'static4.castor-informatique.fr/help/examples_codecast.html';
            allConcepts = allConcepts.concat([{
                id: 'exemples',
                name: getMessage('TASK_DOCUMENTATION_CODE_EXAMPLES').s,
                url: conceptBaseUrl + '#examples',
                isBase: true
            }])
        }

        const taskConcept = {
            id: 'task-instructions',
            name: getMessage('TASK_DOCUMENTATION_INSTRUCTIONS').s,
        };

        let documentationConcepts: DocumentationConcept[] = window.conceptsFill(concepts, allConcepts);
        if (hasTaskInstructions) {
            documentationConcepts = [
                taskConcept,
                ...documentationConcepts,
            ];
        }

        return documentationConcepts;
    }

    return null;
}

function* documentationLoadSaga(standalone: boolean, hasTaskInstructions: boolean) {
    if (standalone) {
        try {
            const {concepts, selectedConceptId, availablePlatforms, screen, language} = yield* call(getConceptsFromChannel);
            const currentSelectedConceptId = yield* appSelect(state => state.documentation.selectedConceptId);
            const firstLoad = null === currentSelectedConceptId;
            if (firstLoad) {
                const currentScreen = yield* appSelect(state => state.screen);
                if (currentScreen !== screen) {
                    yield* put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen}});
                }
                yield* put(taskSetAvailablePlatforms(availablePlatforms));
                yield* put(documentationLanguageChanged(language));
            }

            yield* call(loadDocumentationConcepts, concepts, firstLoad ? selectedConceptId : currentSelectedConceptId);
        } catch (e: any) {
            yield* put({type: CommonActionTypes.Error, payload: {error: getMessage('TASK_DOCUMENTATION_LOAD_ERROR'), closable: false}});
        }
    } else {
        const language = yield* appSelect(state => state.documentation.language);
        const currentTask = yield* appSelect(state => state.task.currentTask);
        const concepts = getConceptsFromLanguage(hasTaskInstructions, currentTask, language);
        if (null !== concepts) {
            yield* call(loadDocumentationConcepts, concepts);
        }
    }
}

function* loadDocumentationConcepts(documentationConcepts, selectedConceptId = null) {
    yield* put(documentationConceptsLoaded(documentationConcepts));

    if (selectedConceptId) {
        yield* put(documentationConceptSelected(selectedConceptId));
    } else {
        const selectedConceptId = yield* appSelect(state => state.documentation.selectedConceptId);
        if (documentationConcepts.length && (!selectedConceptId || !documentationConcepts.find(concept => selectedConceptId === concept.id))) {
            yield* put(documentationConceptSelected(documentationConcepts[0].id));
        }
    }
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        if ('main' !== app.environment) {
            return;
        }

        window.conceptViewer = {
            showConcept(concept, show) {
                if (concept) {
                    app.dispatch(documentationConceptSelected(concept));
                }
                app.dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.DocumentationSmall}});
            },
        };

        yield* takeEvery(documentationLoad, function* (action) {
            yield* call(documentationLoadSaga, action.payload.standalone, action.payload.hasTaskInstructions);
        });

        yield* takeEvery(documentationOpenInNewWindow, function* (action) {
            const searchParams = new URLSearchParams(document.location.search);
            searchParams.set('documentation', '1');
            // const documentationUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + searchParams.toString();
            // Always open a static domain in HTTPS because tasks can be open in frames and not in Codecast
            // TODO: use version 7.3
            const documentationUrl = "https://codecast-dev.france-ioi.org/next/task" + '?' + searchParams.toString();

            const fullscreenWindow = window.open(documentationUrl);
            const channel = window.Channel.build({window: fullscreenWindow, origin: '*', scope: 'test'});

            const language = yield* appSelect(state => state.documentation.language);
            const currentTask = yield* appSelect(state => state.task.currentTask);
            const screen = yield* appSelect(state => state.screen);
            const availablePlatforms = yield* appSelect(state => state.task.availablePlatforms);
            const selectedConceptId = yield* appSelect(state => state.documentation.selectedConceptId);
            const hasTaskInstructions = action.payload.hasTaskInstructions;

            channel.bind('getConceptViewerConfigs', () => {
                const concepts = getConceptsFromLanguage(hasTaskInstructions, currentTask, language);

                return {
                    concepts,
                    selectedConceptId,
                    language,
                    availablePlatforms,
                    screen,
                };
            });

            channel.bind('useCodeExample', (instance, {code, language}) => {
                app.dispatch(documentationUseCodeExample(code, language));
            });
        });

        yield* takeEvery(documentationUseCodeExample, function* (action) {
            const {code, language} = action.payload;

            yield* put({
                type: BufferActionTypes.BufferReset,
                buffer: 'source',
                model: documentModelFromString(code),
            });
            yield* put({
                type: CommonActionTypes.PlatformChanged,
                payload: {
                    platform: 'c' === language ? CodecastPlatform.Unix : language,
                },
            });
            yield* put({
                type: CommonActionTypes.AppSwitchToScreen,
                payload: {screen: null},
            });
        });

        // @ts-ignore
        yield* takeEvery([ActionTypes.PlatformChanged, TaskActionTypes.TaskLoad], function* () {
            const newPlatform = yield* appSelect(state => state.options.platform);
            const documentationLanguage = yield* appSelect(state => state.documentation.language);
            const platformDocumentationLanguage = convertPlatformToDocumentationLanguage(newPlatform);
            if (platformDocumentationLanguage !== documentationLanguage) {
                yield* put(documentationLanguageChanged(platformDocumentationLanguage));
            }
        });
    });
}
