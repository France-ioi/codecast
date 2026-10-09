import {call, put, throttle} from "typed-redux-saga";
import {asyncGetJson, asyncRequestJson} from "../utils/api";
import {
    EditorState,
    EditorStateHistoryCache,
    EditorStateHistoryElement,
    EditorStateHistoryOptions,
    EditorStateHistoryPatch,
    EditorStateHistoryResponse,
    EditorStateSource,
    EditorStateTest,
    isServerTask,
    Task,
    TaskAnswer,
    TaskServer,
    TaskTest,
    TaskTestGroupType,
} from '../task/task_types';
import {appSelect} from '../hooks';
import {TaskSubmissionServerResult} from './submission_types';
import {smartContractPlatforms} from '../task/libs/smart_contract/smart_contract_blocks';
import {getAvailablePlatformsFromSupportedLanguages, hasBlockPlatform, platformsList} from '../stepper/platforms';
import {BlockBufferHandler, documentToString, TextBufferHandler} from '../buffers/document';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {delay} from '../player/sagas';
import {BlockDocument, BufferType} from '../buffers/buffer_types';
import {getBlocklyCodeFromXml} from '../stepper/js';
import merge from 'lodash/merge';
import {AppStore} from '../store';
import {selectSourceBuffers} from '../buffers/buffer_selectors';
import {selectCurrentTest} from '../task/task_selectors';
import {
    bufferChangeActiveBufferName,
    bufferEdit,
    bufferEditPlain,
    bufferInit,
    bufferRemove,
} from '../buffers/buffers_slice';
import {
    addNewTaskTest,
    removeTaskTest,
    updateCurrentTestId,
    updateTaskTest,
    updateTaskTests,
} from '../task/task_slice';
import {createSourceBufferFromBufferParameters} from '../buffers';
import {getRandomId} from '../utils/app';
import {selectTaskTests} from './submission_selectors';
import {selectTaskTokenPayload} from '../task/platform/platform_selectors';
import {getMessage} from '../lang/messages';
import {platformEditorStateHistoryLoaded} from '../task/platform/platform_slice';
import {
    describeEditorStateHistory,
    EditorStateSerialized,
    rebuildEditorStateHistoryState,
    selectEditorStateHistoryElements,
} from './editor_state_history';

export function* getTaskFromId(taskId: string, token: string, platform: string): Generator<any, TaskServer|null> {
    const state = yield* appSelect();
    const {taskPlatformUrl} = state.options;
    const queryParameters = {
        ...(token ? {token} : {}),
        ...(platform ? {platform} : {}),
    };

    return (yield* call(asyncGetJson, taskPlatformUrl + '/tasks/' + taskId, queryParameters)) as TaskServer|null;
}

export function* convertServerTaskToCodecastFormat(task: TaskServer): Generator<any, Task> {
    // task.scriptAnimation = "\n       window.taskData = subTask = {};\n       subTask.gridInfos = {\n         context: 'smart_contract',\n         importModules: ['smart_contract_config'],\n         showLabels: true,\n         conceptViewer: true,\n         includeBlocks: {\n           groupByCategory: true,\n           standardBlocks: {\n             wholeCategories: ['smart_contract_main_blocks', 'smart_contract_types'],\n           },\n         },\n         expectedStorage: \"(string %names)\",\n         taskStrings: {\n           \"storageDescription\": {\n             \"names\": \"it should contain its initial value then the list of names of the callers, all separated with commas\",\n           },\n         },\n         // expectedStorage: \"(Pair (string %names) (nat %nb_calls))\",\n       };\n     ";
    if (task.scriptAnimation) {
        try {
            let script = document.createElement('script');
            script.setAttribute('type', 'text/javascript');
            script.text = task.scriptAnimation;
            document.head.appendChild(script);
            yield* delay(0);

            // For backward-compatibility
            // @ts-ignore
            let taskSettingsObject = 'undefined' !== typeof taskSettings ? taskSettings : null;
            if (taskSettingsObject && !window.taskData) {
                // Convert taskSettings into window.taskData
                window.taskData = getTaskDataFromTaskSettings(taskSettingsObject);
            }

            // @ts-ignore
            let clientExecutionParameters = 'undefined' !== typeof ClientExecutionParameters ? ClientExecutionParameters : null;
            if (clientExecutionParameters && !window.taskData) {
                // Convert taskSettings into window.taskData
                window.taskData = clientExecutionParameters;
            }

            return getServerTaskFromTaskData(window.taskData, task);
        } catch (ex) {
            console.error("Couldn't execute script animation", ex);
        }
    }

    // Use this for now to check if it's a Smart Contract task. Change this in the future
    if (smartContractPlatforms.find(platform => -1 !== getAvailablePlatformsFromSupportedLanguages(task.supportedLanguages).indexOf(platform))) {
        return {
            ...task,
            gridInfos: {
                context: 'smart_contract',
                importModules: ['smart_contract_config'],
                showLabels: true,
                conceptViewer: true,
                tabsEnabled: true,
                includeBlocks: {
                    groupByCategory: true,
                    standardBlocks: {
                        wholeCategories: ['smart_contract_main_blocks', 'smart_contract_types'],
                    },
                },
                ...(window.taskData?.gridInfos ? window.taskData.gridInfos : {}),
                // expectedStorage: "(string %names)",
                // expectedStorage: "(Pair (string %names) (nat %nb_calls))",
                // hints: [
                //     {content: 'Indice 1'},
                //     {content: 'Indice 2'},
                // ],
            },
        };
    } else {
        return {
            ...task,
            gridInfos: {
                context: 'printer',
                importModules: [],
                showLabels: true,
                conceptViewer: true,
                tabsEnabled: true,
                // maxInstructions: {
                //     easy: 20,
                //     medium: 30,
                //     hard: 40
                // },
                // nbPlatforms: 100,
                includeBlocks: {
                    groupByCategory: true,
                    standardBlocks: {
                        includeAll: true,
                        singleBlocks: ["controls_repeat", "controls_if"]
                    },
                    generatedBlocks: {
                        printer: ["print", "read"]
                    },
                    variables: [],
                    pythonAdditionalFunctions: ["len"]
                },
                checkEndEveryTurn: false,
                checkEndCondition: function (context, lastTurn) {
                    if (!lastTurn) return;
                    context.checkOutputHelper();
                    context.success = true;
                    throw(window.languageStrings.messages.outputCorrect);
                },
                ...(window.taskData?.gridInfos ? window.taskData.gridInfos : {}),
            },
        }
    }
}

export function getTaskDataFromTaskSettings(taskSettings: any) {
    const taskData = taskSettings;
    window.initBlocklySubTask = function () {
    };
    taskSettings.initTask(taskData);
    delete taskSettings.initTask;

    return taskData;
}

export function getServerTaskFromTaskData(taskData: Task, task: TaskServer = null): Task {
    const defaultTask = {
        commentSource: 'algorea',
        gridInfos: {
            context: 'printer',
            hideSaveOrLoad: true,
            actionDelay: 200,
            includeBlocks: {
                groupByCategory: true,
                standardBlocks: {
                    includeAll: false,
                    wholeCategories: ['logic', 'loops', 'math', 'lists', 'variables', 'functions'],
                    singleBlocks: ['input_num', 'text', 'text_print', 'text_join', 'text_append']
                },
                ...((!taskData?.gridInfos?.context || 'printer' === taskData.gridInfos.context) ? {
                    generatedBlocks: {
                        printer: ["print", "read"]
                    },
                } : {}),
            },
            maxInstructions: 0,
            libOptions: {
                highlightRead: true
            },
            importModules: [],
            checkEndEveryTurn: false,
            panelCollapsed: true,
            checkEndCondition: function (context, lastTurn) {
                if (!lastTurn) return;
                context.checkOutputHelper();
                context.success = true;
                throw (window.languageStrings.messages.outputCorrect);
            },
            computeGrade: function (context, message) {
                var rate = 0;
                if (context.success) {
                    rate = 1;
                    if (context.nbMoves > 100) {
                        rate /= 2;
                        message += window.languageStrings.messages.moreThan100Moves;
                    }
                }
                return {
                    successRate: rate,
                    message: message
                };
            }
        },
    };

    taskData = merge(defaultTask, taskData);

    if (taskData.data && false !== taskData.gridInfos.allowClientExecution) {
        taskData.gridInfos.allowClientExecution = true;
    }

    if (window.PEMTaskMetaData) {
        convertPEMTaskMetadataToServerTask(taskData, window.PEMTaskMetaData);
    }

    if (task?.useLatex) {
        taskData.gridInfos.importModules = [
            ...(taskData.gridInfos.importModules ?? []),
            'mathjax',
        ];
    }

    return {
        ...(task ?? {}),
        ...taskData,
    };
}

export function convertPEMTaskMetadataToServerTask(taskData: Task, PEMTaskMetaData: any) {
    if (PEMTaskMetaData.supportedLanguages) {
        taskData.supportedLanguages = PEMTaskMetaData.supportedLanguages.join(',');
    }
    if (PEMTaskMetaData.useLatex) {
        taskData.useLatex = !!PEMTaskMetaData.useLatex;
    }
    if (PEMTaskMetaData.limits) {
        taskData.limits = (Object.entries(PEMTaskMetaData.limits) as any).map(([language, limit]) => ({
            language,
            maxTime: limit.time,
            maxMemory: limit.memory,
        }));
    }
    if (PEMTaskMetaData.hasUserTests) {
        taskData.userTests = true;
    }
}

export function* longPollServerSubmissionResults(submissionId: string, callback: (result: TaskSubmissionServerResult) => void) {
    const state = yield* appSelect();
    const {taskPlatformUrl} = state.options;

    const hasTests = state.task.currentTask.tests?.length;
    const totalUrl = `${taskPlatformUrl}/submissions/${submissionId}`;
    const queryParameters = {
        longPolling: '1',
        ...(!hasTests ? {withTests: '1'} : {}),
        ...(state.platform.taskToken ? {token: state.platform.taskToken} : {}),
        ...(state.platform.platformName ? {platform: state.platform.platformName} : {}),
    };

    while (true) {
        const result = (yield* call(asyncGetJson, totalUrl, queryParameters)) as TaskSubmissionServerResult|null;
        if (result.evaluated) {
            callback(result);
            return;
        }
    }
}

export function* getServerSubmissionFromUserAnswerId(submissionId: string) {
    const state = yield* appSelect();
    const taskPlatformUrl = state.options.taskPlatformUrl;
    const hasTests = state.task.currentTask.tests?.length;

    const totalUrl = `${taskPlatformUrl}/submissions/user-answer/${submissionId}`;
    const queryParameters = {
        ...(!hasTests ? {withTests: '1'} : {}),
        ...(state.platform.taskToken ? {token: state.platform.taskToken} : {}),
        ...(state.platform.platformName ? {platform: state.platform.platformName} : {}),
    };

    return (yield* call(asyncGetJson, totalUrl, queryParameters)) as TaskSubmissionServerResult|null;
}

export function* makeServerSubmission(answer: TaskAnswer, answerToken: string, platform: CodecastPlatform, userTests: TaskTest[]) {
    const state = yield* appSelect();
    const taskPlatformUrl = state.options.taskPlatformUrl;
    const taskToken = state.platform.taskToken;

    let answerContent = documentToString(answer.document);
    let language: string = platform;
    if (BufferType.Block === answer.document.type) {
        language = 'python';
        const pythonCode = yield* call(getBlocklyCodeFromXml, answer.document as BlockDocument, 'python', state);
        answerContent = '# blocklyXml: ' + answerContent + '\n\n' + pythonCode;
    }

    const body = {
        token: taskToken,
        answerToken: answerToken,
        answer: {
            language,
            fileName: answer.fileName,
            sourceCode: answerContent,
        },
        userTests: userTests.map(test => ({
            name: test.name,
            input: test.data?.input ? test.data?.input : '',
            output: test.data?.output ? test.data?.output : '',
            clientId: test.id,
        })),
        sLocale: state.options.language.split('-')[0],
        platform: state.platform.platformName,
        taskId: String(state.task.currentTask.id),
        taskParams: {
            minScore: 0,
            maxScore: 100,
            noScore: 0,
            readOnly: false,
            randomSeed: '',
            returnUrl: '',
        },
    };

    return (yield* call(asyncRequestJson, taskPlatformUrl + '/submissions', body, false)) as {success: boolean, submissionId?: string};
}

// Save the editor state at most once every 60 seconds
const saveEditorsThrottleDelay = 60 * 1000;
let lastSavedEditorState: {taskId: string, editorState: string}|null = null;
let reloadedEditorStateTaskId: string|null = null;
let pendingEditorState: EditorState|null = null;
let reloadingEditorState = false;

function getEditorStateSources(state: AppStore): EditorStateSource[] {
    const sourceBuffers = selectSourceBuffers(state);

    return Object.entries(sourceBuffers)
        // A tab displaying the code of a past submission is read-only, it's not part of the editor state
        .filter(([, buffer]) => null === buffer.submissionIndex || undefined === buffer.submissionIndex)
        .map(([bufferName, buffer]) => ({
            name: buffer.fileName ?? '',
            source: documentToString(buffer.document),
            language: buffer.platform ?? state.options.platform,
            active: bufferName === state.buffers.activeBufferName,
        }));
}

function getEditorStateTests(state: AppStore): EditorStateTest[]|null {
    const currentTest = selectCurrentTest(state);

    return state.task.taskTests
        .filter(test => TaskTestGroupType.User === test.groupType)
        .map(test => ({
            name: test.name ?? '',
            input: test.data?.input ?? '',
            output: test.data?.output ?? '',
            active: !!currentTest && currentTest.id === test.id,
            clientId: test.id,
        }));
}

function getEditorState(state: AppStore): EditorState {
    return {
        sources: getEditorStateSources(state),
        tests: getEditorStateTests(state),
    };
}

export function* saveEditors() {
    const state = yield* appSelect();
    const currentTask = state.task.currentTask;
    const taskPlatformUrl = state.options.taskPlatformUrl;
    const tokenPayload = yield* appSelect(selectTaskTokenPayload);

    // Only the state of a task loaded from the task platform can be saved there, and as in the
    // previous platform, the state of a read-only task is never saved
    if (reloadingEditorState || 'main' !== state.environment || !state.task.loaded || !taskPlatformUrl
        || !isServerTask(currentTask) || !currentTask?.id || false === currentTask.isEvaluable
        || false === tokenPayload?.bSubmissionPossible
    ) {
        return;
    }

    const taskId = String(currentTask.id);
    const editorState = getEditorState(state);

    const serializedEditorState = JSON.stringify(editorState);
    if (taskId === lastSavedEditorState?.taskId && serializedEditorState === lastSavedEditorState?.editorState) {
        return;
    }

    const body = {
        ...editorState,
        ...(state.platform.taskToken ? {token: state.platform.taskToken} : {}),
        ...(state.platform.platformName ? {platform: state.platform.platformName} : {}),
    };

    try {
        yield* call(asyncRequestJson, `${taskPlatformUrl}/tasks/${taskId}/editor-state`, body, false);
    } catch (e) {
        // The editor state will be saved again on the next change
        console.error("Couldn't save the editor state", e);

        return;
    }

    lastSavedEditorState = {taskId, editorState: serializedEditorState};
}

/**
 * Takes the editor state of the task that has just been loaded as the saved one: it is either the
 * default one, or the one restored from the task platform, none of which needs to be saved. Without
 * that, the save done before reloading an answer would send the empty default code tab to the task
 * platform. The refreshes of the task that follow keep the last state actually saved.
 */
export function* initSavedEditorState() {
    const state = yield* appSelect();
    const currentTask = state.task.currentTask;
    if ('main' !== state.environment || !isServerTask(currentTask) || !currentTask?.id) {
        return;
    }

    const taskId = String(currentTask.id);
    if (taskId === lastSavedEditorState?.taskId) {
        return;
    }

    lastSavedEditorState = {taskId, editorState: JSON.stringify(getEditorState(state))};
}

export function isEditorStateReloaded(): boolean {
    return null !== reloadedEditorStateTaskId;
}

/**
 * Takes the state of the editor that was saved on the task platform for the current user, to
 * restore the content of their code tabs, with the one they were on selected again, and their
 * tests. It is only taken once per task: the refreshes of the task that follow must not discard the
 * work in progress.
 *
 * The state is restored right away when the task is already loaded, and kept for
 * reloadPendingEditorState otherwise: loading the task creates a default code tab and extracts the
 * tests of the task, both of which would overwrite it. This never waits for the task to be loaded,
 * because the platform can be waiting for the token update that brought this state to be over
 * before it asks for the task to be loaded.
 */
export function* reloadEditorState(taskId: string, editorState: EditorState) {
    const state = yield* appSelect();
    if ('main' !== state.environment || taskId === reloadedEditorStateTaskId) {
        return;
    }

    // From now on the answer of the platform is ignored, even before the state is restored: the
    // platform may send it in between, and it would overwrite the state we are about to restore
    reloadedEditorStateTaskId = taskId;
    pendingEditorState = editorState;

    if (state.task.loaded) {
        yield* call(reloadPendingEditorState);
        // The state that has just been restored is the one of the task platform, no need to save it again
        lastSavedEditorState = {taskId, editorState: JSON.stringify(getEditorState(yield* appSelect()))};
    }
}

export function* reloadPendingEditorState() {
    const environment = yield* appSelect(state => state.environment);
    if ('main' !== environment || null === pendingEditorState) {
        return;
    }

    const editorState = pendingEditorState;
    pendingEditorState = null;

    yield* call(restoreEditorState, editorState);
}

function* restoreEditorState(editorState: EditorState) {
    reloadingEditorState = true;
    try {
        yield* call(reloadEditorStateSources, editorState.sources);
        if (editorState.tests) {
            yield* call(reloadEditorStateTests, editorState.tests);
        }
    } finally {
        reloadingEditorState = false;
    }
}

// The number of saves fetched at once from the task platform
const editorStateHistoryPageSize = 200;
// Tells the chains of saves apart: the task platform keeps one per platform, task and attempt, which
// the task token gives. The chain of an attempt is the one of its participant, which is a team in team solving: it
// holds the saves of all the users of the team, so the user of the token is not part of the key.
// idAttempt is only compared, never parsed. Like the task platform, a token without idAttempt falls
// back to a single attempt per user
function* getEditorStateHistoryKey(): Generator<any, string> {
    const state = yield* appSelect();
    const tokenPayload = yield* appSelect(selectTaskTokenPayload);
    const attempt = tokenPayload?.idAttempt ? {idAttempt: tokenPayload.idAttempt} : {idUser: tokenPayload?.idUser ?? null};

    return JSON.stringify([state.platform.platformName ?? null, String(state.task.currentTask?.id), attempt]);
}

function* fetchEditorStateHistoryPage(earlierThanId: number|null): Generator<any, EditorStateHistoryResponse> {
    const state = yield* appSelect();
    const queryParameters = {
        ...(state.platform.taskToken ? {token: state.platform.taskToken} : {}),
        ...(state.platform.platformName ? {platform: state.platform.platformName} : {}),
        limit: String(editorStateHistoryPageSize),
        ...(null !== earlierThanId ? {earlierThanId: String(earlierThanId)} : {}),
    };

    return (yield* call(
        asyncGetJson,
        `${state.options.taskPlatformUrl}/tasks/${String(state.task.currentTask.id)}/editor-state/history`,
        queryParameters,
    )) as EditorStateHistoryResponse;
}

function isEditorStateHistoryPageLast(patches: EditorStateHistoryPatch[]): boolean {
    return patches.length < editorStateHistoryPageSize || 1 === patches[patches.length - 1].id;
}

/**
 * Fetches the newest saves of the chain, to see the saves made since the history was last fetched.
 * The saves already fetched are kept when the new page reaches them: only the newest save of a
 * chain ever changes (it gets its patch when a newer one is made), the older ones stay valid, and
 * so do their descriptions.
 */
function* refreshEditorStateHistory(): Generator<any, EditorStateHistoryCache> {
    const key = yield* call(getEditorStateHistoryKey);
    const page = yield* call(fetchEditorStateHistoryPage, null);
    const cache = yield* appSelect(state => state.platform.editorStateHistory);

    let history: EditorStateHistoryCache;
    const pageOldestId = page.patches.length ? page.patches[page.patches.length - 1].id : null;
    if (null !== pageOldestId && key === cache?.key && cache.patches.length && pageOldestId <= cache.patches[0].id) {
        history = {
            ...cache,
            headState: page.state,
            patches: [...page.patches, ...cache.patches.filter(patch => patch.id < pageOldestId)],
        };
    } else {
        history = {
            key,
            headState: page.state,
            patches: page.patches,
            complete: isEditorStateHistoryPageLast(page.patches),
            descriptions: {},
            oldestRebuiltState: null,
        };
    }

    history = describeEditorStateHistory(history);
    yield* put(platformEditorStateHistoryLoaded(history));

    return history;
}

// Fetches the page of the chain that comes before the saves already fetched
function* extendEditorStateHistory(history: EditorStateHistoryCache): Generator<any, EditorStateHistoryCache> {
    if (history.complete || !history.patches.length) {
        return {...history, complete: true};
    }

    const page = yield* call(fetchEditorStateHistoryPage, history.patches[history.patches.length - 1].id - 1);
    const extendedHistory = describeEditorStateHistory({
        ...history,
        patches: [...history.patches, ...page.patches],
        complete: isEditorStateHistoryPageLast(page.patches),
    });

    yield* put(platformEditorStateHistoryLoaded(extendedHistory));

    return extendedHistory;
}

function* getCurrentEditorStateHistory(refresh: boolean): Generator<any, EditorStateHistoryCache> {
    const key = yield* call(getEditorStateHistoryKey);
    const cache = yield* appSelect(state => state.platform.editorStateHistory);
    if (refresh || key !== cache?.key) {
        return yield* call(refreshEditorStateHistory);
    }

    return cache;
}

function canUseEditorStateHistory(state: AppStore): boolean {
    const currentTask = state.task.currentTask;

    return 'main' === state.environment && !!state.options.taskPlatformUrl && isServerTask(currentTask) && !!currentTask?.id;
}

/**
 * Describes a page of the history of the editor state of the current attempt, newest first, from
 * the chain of saves fetched from the task platform, which is fetched further as needed. A page
 * without maxId starts from the newest save, and the chain is refreshed to include the
 * saves made since it was last fetched.
 */
export function* loadEditorStateHistory(options: EditorStateHistoryOptions): Generator<any, EditorStateHistoryElement[]> {
    const state = yield* appSelect();
    if (!canUseEditorStateHistory(state)) {
        return [];
    }
    if (options?.limit > 1000) {
        throw new Error('The limit must be less than or equal to 1000');
    }

    let history = yield* call(getCurrentEditorStateHistory, undefined === options?.maxId || null === options?.maxId);
    while (true) {
        const elements = selectEditorStateHistoryElements(history, options ?? {});
        if (null !== elements) {
            // The task platform names the languages as Codecast does (python, blockly...), the
            // platform displays them
            return elements.map(element => ({
                ...element,
                tags: element.tags.map(tag => ({
                    ...tag,
                    i18nText: getMessage(`EDITOR_HISTORY_TAG_${tag.identifier.toUpperCase()}`).s,
                })),
                activeTab: null !== element.activeTab ? {
                    ...element.activeTab,
                    name: state.options.tabsEnabled ? element.activeTab.name : null,
                    progLang: platformsList[element.activeTab.progLang]?.name ?? element.activeTab.progLang,
                } : null,
            }));
        }

        history = yield* call(extendEditorStateHistory, history);
    }
}

/**
 * Puts back in the editor the state of a save of the history. It is rebuilt from the newest state
 * by applying the patches of the saves down to it, the chain being fetched further as needed. The
 * reloaded state is not saved until the user changes something.
 */
export function* reloadEditorStateHistoryElement(elementId: number) {
    const state = yield* appSelect();
    if (!canUseEditorStateHistory(state)) {
        throw new Error('The history of the editor is not available for this task');
    }

    let history = yield* call(getCurrentEditorStateHistory, false);
    if (!history.patches.length || elementId > history.patches[0].id) {
        // The save was made after the history was fetched
        history = yield* call(refreshEditorStateHistory);
    }
    while (!history.complete && history.patches[history.patches.length - 1].id > elementId) {
        history = yield* call(extendEditorStateHistory, history);
    }

    const serializedState = rebuildEditorStateHistoryState(history, elementId);

    // The work in progress may not have been saved yet because of the throttling
    yield* call(saveEditors);
    yield* call(restoreEditorState, denormalizeSerializedEditorState(JSON.parse(serializedState) as EditorStateSerialized));

    // The reloaded state is taken as saved: it will only be saved once the user changes it
    const taskId = String(state.task.currentTask.id);
    const newState = yield* appSelect();
    lastSavedEditorState = {taskId, editorState: JSON.stringify(getEditorState(newState))};
}

function denormalizeSerializedEditorState(state: EditorStateSerialized): EditorState {
    return {
        sources: state.sources.map(source => ({
            name: source.name,
            source: source.source.join('\n'),
            language: source.language,
            active: source.active,
        })),
        tests: state.tests ?? null,
    };
}

function keepOneSourcePerLanguage(sources: EditorStateSource[]): EditorStateSource[] {
    const sourcesByLanguage = new Map<string, EditorStateSource>();
    for (let source of sources) {
        if (!sourcesByLanguage.has(source.language) || source.active) {
            sourcesByLanguage.set(source.language, source);
        }
    }

    return [...sourcesByLanguage.values()];
}

function* reloadEditorStateSources(sources: EditorStateSource[]) {
    if (!sources.length) {
        return;
    }

    const state = yield* appSelect();

    const restoredSources = state.options.tabsEnabled
        ? sources
        : keepOneSourcePerLanguage(sources);

    // The tabs currently open were created by the loading of the task, they are replaced by the
    // saved ones. The tabs displaying the code of a past submission are read-only, they are not
    // part of the editor state and are left untouched
    const previousBufferNames = Object.entries(selectSourceBuffers(state))
        .filter(([, buffer]) => null === buffer.submissionIndex || undefined === buffer.submissionIndex)
        .map(([bufferName]) => bufferName);

    let activeBufferName: string|null = null;
    for (let source of restoredSources) {
        const platform = source.language as CodecastPlatform;
        const document = hasBlockPlatform(platform)
            ? BlockBufferHandler.documentFromObject({blockly: source.source})
            : TextBufferHandler.documentFromString(source.source);

        const bufferName = yield* call(createSourceBufferFromBufferParameters, {
            type: document.type,
            source: true,
            document,
            fileName: source.name,
            platform,
        }, {noSwitch: true});

        if (source.active || null === activeBufferName) {
            activeBufferName = bufferName;
        }
    }

    // The new tabs are created before the old ones are removed so that the active tab always exists
    yield* put(bufferChangeActiveBufferName(activeBufferName));
    for (let bufferName of previousBufferNames) {
        yield* put(bufferRemove(bufferName));
    }
}

function* reloadEditorStateTests(tests: EditorStateTest[]) {
    const state = yield* appSelect();
    const level = state.task.currentLevel;

    // The tests of the task are kept as they are, only the tests of the user are restored
    yield* put(updateTaskTests([
        ...state.task.taskTests.filter(test => TaskTestGroupType.User !== test.groupType),
        ...tests.map(test => ({
            id: test.clientId ?? getRandomId(),
            name: test.name,
            data: {input: test.input, output: test.output},
            contextState: null,
            groupType: TaskTestGroupType.User,
            level,
        })),
    ]));

    // updateTaskTests clears the current test, select again the one the user was on
    const newTests = yield* appSelect(selectTaskTests);
    const activeTest = tests.find(test => test.active);
    const activeTestIndex = activeTest ? newTests.findIndex(test => activeTest.clientId === test.id) : -1;
    const testId = -1 !== activeTestIndex ? activeTestIndex : (newTests.length ? 0 : null);
    yield* put(updateCurrentTestId({testId, record: false}));
}

export function* saveEditorsSaga() {
    yield* throttle(saveEditorsThrottleDelay, [
        // A code tab was edited, created, renamed or removed. Switching tabs alone is not saved: the
        // active tab is saved with the next change, which the task platform then makes a checkpoint
        bufferEdit,
        bufferEditPlain,
        bufferInit,
        bufferRemove,
        // A test was edited, created or removed
        updateTaskTest,
        addNewTaskTest,
        removeTaskTest,
    ], saveEditors);
}
