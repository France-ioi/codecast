import {Bundle} from "../../linker";
import {call, put, takeEvery} from "typed-redux-saga";
import {
    DocumentationConcept,
    documentationConceptSelected,
    documentationConceptsLoaded,
    DocumentationLanguage,
    documentationLanguageChanged,
} from "./documentation_slice";
import {ActionTypes, ActionTypes as CommonActionTypes} from "../../common/actionTypes";
import {getMessage} from "../../lang";
import {Screen} from "../../common/screens";
import {appSelect} from '../../hooks';
import {
    TaskActionTypes,
    taskSetAvailablePlatforms
} from '../task_slice';
import {getNotionsBagFromIncludeBlocks, NotionArborescence} from '../blocks/notions';
import {createAction} from '@reduxjs/toolkit';
import {addAutoRecordingBehaviour} from '../../recorder/record';
import {TextBufferHandler} from '../../buffers/document';
import {QuickalgoTaskIncludeBlocks, Task} from '../task_types';
import {CodecastPlatform} from '../../stepper/codecast_platform';
import {App} from '../../app_types';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {bufferEditPlain} from '../../buffers/buffers_slice';
import {AppStore} from '../../store';

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
    return new Promise<ConceptViewerConfigs>((resolve, reject) => {
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

    let concepts = [{id: 'language'}];
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
                return concept.python && concept.python.length;
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

function getConceptsFromLanguage(hasTaskInstructions: boolean, state: AppStore) {
    const language = state.documentation.language;
    const currentTask = state.task.currentTask;

    let documentationConcepts: DocumentationConcept[] = [];
    if (hasTaskInstructions && currentTask) {
        const taskConcept = {
            id: 'task-instructions',
            name: getMessage('TASK_DOCUMENTATION_INSTRUCTIONS').s,
        };

        documentationConcepts.push(taskConcept);
    }

    let context = quickAlgoLibraries.getContext(null, 'main');
    if (context?.infos.conceptViewer) {
        let concepts = [], allConcepts = [];

        const isTralalere = 'tralalere' == state.options.app;
        const knownBaseConceptUrls = {
            'tralalere': 'https://static4.castor-informatique.fr/help/index_tralalere.html',
            'tralalere_en': 'https://static4.castor-informatique.fr/help/index_tralalere_en.html',
            'tralalere_v2': 'https://static4.castor-informatique.fr/help/index_tralalere_v2.html',
        };
        let baseConceptUrl = context.infos.conceptViewerBaseUrl;
        if (baseConceptUrl === undefined) {
            baseConceptUrl = isTralalere ? 'tralalere' : null;
        }
        if (baseConceptUrl) {
            baseConceptUrl = knownBaseConceptUrls[baseConceptUrl + '_' + window.stringsLanguage] || knownBaseConceptUrls[baseConceptUrl] || baseConceptUrl;
        }

        if (DocumentationLanguage.C !== language) {
            allConcepts = window.getConceptViewerBaseConcepts(baseConceptUrl);
            console.log('base concepts', allConcepts);
            for (let concept of context.getConceptList()) {
                if (concept.id && -1 !== allConcepts.findIndex(otherConcept => otherConcept.id === concept.id)) {
                    allConcepts.splice(allConcepts.findIndex(otherConcept => otherConcept.id === concept.id), 1);
                }
                allConcepts.push(concept);
            }

            concepts = getConceptsFromBlocks(context.infos.includeBlocks, allConcepts, context.getNotionsList());
            const disabledConcepts = context.conceptDisabledList ? context.conceptDisabledList : [];
            concepts = concepts.filter(concept => -1 === disabledConcepts.indexOf(concept.id));
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

        const newConcepts = window.conceptsFill(concepts, allConcepts);
        documentationConcepts = [...documentationConcepts, ...newConcepts];
    }

    return documentationConcepts.length ? documentationConcepts : null;
}

function* documentationLoadSaga(standalone: boolean, hasTaskInstructions: boolean) {
    if (standalone) {
        try {
            const conceptsConfig = yield* call(getConceptsFromChannel);
            const {concepts, selectedConceptId, availablePlatforms, screen, language, canChangePlatform} = conceptsConfig;
            const currentSelectedConceptId = yield* appSelect(state => state.documentation.selectedConceptId);
            const firstLoad = null === currentSelectedConceptId;
            if (firstLoad) {
                const currentScreen = yield* appSelect(state => state.screen);
                if (currentScreen !== screen) {
                    yield* put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen}});
                }
                yield* put({type: CommonActionTypes.CanChangePlatformChanged, payload: {canChangePlatform}});
                yield* put(taskSetAvailablePlatforms(availablePlatforms));
                yield* put(documentationLanguageChanged(language));
            }

            yield* call(loadDocumentationConcepts, concepts, firstLoad ? selectedConceptId : currentSelectedConceptId);
        } catch (e: any) {
            console.error(e);
            yield* put({type: CommonActionTypes.Error, payload: {error: getMessage('TASK_DOCUMENTATION_LOAD_ERROR'), closable: false}});
        }
    } else {
        const state = yield* appSelect();
        const concepts = getConceptsFromLanguage(hasTaskInstructions, state);
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

export interface ConceptViewerConfigs {
    concepts: DocumentationConcept[],
    selectedConceptId: string,
    availablePlatforms: string[],
    screen: string,
    language: DocumentationLanguage,
    canChangePlatform: boolean,
}

export default function (bundle: Bundle) {
    bundle.addSaga(function* (app: App) {
        yield* takeEvery(documentationUseCodeExample, function* (action) {
            const {code, language} = action.payload;
            const document = TextBufferHandler.documentFromString(code);
            yield* put(bufferEditPlain({buffer: 'source', document}));

            const newPlatform = 'c' === language ? CodecastPlatform.Unix : language;
            const currentPlatform = yield* appSelect(state => state.options.platform);
            if (newPlatform !== currentPlatform) {
                yield* put({
                    type: CommonActionTypes.PlatformChanged,
                    payload: {
                        platform: newPlatform,
                    },
                });
            }
            yield* put({
                type: CommonActionTypes.AppSwitchToScreen,
                payload: {screen: null},
            });
        });

        if ('main' !== app.environment) {
            return;
        }

        const tralalere = yield* appSelect(state => 'tralalere' === state.options.app);

        window.conceptViewer = {
            showConcept(concept, show) {
                if (concept) {
                    app.dispatch(documentationConceptSelected(concept));
                }
                app.dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: tralalere ? Screen.DocumentationBig : Screen.DocumentationSmall}});
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

            const state = yield* appSelect();
            const language = state.documentation.language;
            const screen = state.screen;
            const availablePlatforms = state.task.availablePlatforms;
            const selectedConceptId = state.documentation.selectedConceptId;
            const hasTaskInstructions = action.payload.hasTaskInstructions;
            const canChangePlatform = state.options.canChangePlatform;

            channel.bind('getConceptViewerConfigs', () => {
                const concepts = getConceptsFromLanguage(hasTaskInstructions, state);

                return {
                    concepts,
                    selectedConceptId,
                    language,
                    availablePlatforms,
                    canChangePlatform,
                    screen,
                };
            });

            channel.bind('useCodeExample', (instance, {code, language}) => {
                app.dispatch(documentationUseCodeExample(code, language));
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

        addAutoRecordingBehaviour(app, {
            actions: [
                documentationUseCodeExample,
            ],
            onResetDisabled: true,
        });
    });
}
