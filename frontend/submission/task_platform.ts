import {call, put, throttle} from "typed-redux-saga";
import {asyncGetJson, asyncRequestJson} from "../utils/api";
import {
    EditorState,
    EditorStateHistoryElement, EditorStateHistoryElementTab,
    EditorStateHistoryEntry,
    EditorStateHistoryModificationType,
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
import {platformEditorStateHistoryLoaded} from '../task/platform/platform_slice';
import {applyEditorStatePatch} from './editor_state_patch';

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

// Save the editor state at most once every 20 seconds
const saveEditorsThrottleDelay = 20 * 1000;
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
    if (!state.task.currentTask?.userTests) {
        // The task has no user tests, the ones saved for it must be left untouched
        return null;
    }

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
    const editorState: EditorState = {
        sources: getEditorStateSources(state),
        tests: getEditorStateTests(state),
    };

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

interface EditorStateSerializedSource {
    name: string,
    language: string,
    active: boolean,
    source: string[],
}

interface EditorStateSerialized {
    sources: EditorStateSerializedSource[],
    tests: EditorStateTest[]|null,
}

export function* loadEditorStateHistory(): Generator<any, EditorStateHistoryElement[]> {
    const state = yield* appSelect();
    const currentTask = state.task.currentTask;
    const taskPlatformUrl = state.options.taskPlatformUrl;
    if ('main' !== state.environment || !taskPlatformUrl || !isServerTask(currentTask) || !currentTask?.id) {
        return [];
    }

    const queryParameters = {
        ...(state.platform.taskToken ? {token: state.platform.taskToken} : {}),
        ...(state.platform.platformName ? {platform: state.platform.platformName} : {}),
    };

    const history = (yield* call(
        asyncGetJson,
        `${taskPlatformUrl}/tasks/${String(currentTask.id)}/editor-state/history`,
        queryParameters,
    )) as EditorStateHistoryResponse;

    const entries = buildEditorStateHistory(history);
    yield* put(platformEditorStateHistoryLoaded(entries));

    return entries.map(entry => entry.element);
}

/**
 * Puts back in the editor the version of the state that loadEditorStateHistory described with this
 * id. The state comes from the store, the task platform is not asked again.
 */
export function* reloadEditorStateHistoryElement(historyElementId: number) {
    const entry = yield* appSelect(state => state.platform.editorStateHistory
        .find(entry => historyElementId === entry.element.id));
    if (undefined === entry) {
        throw new Error(`No version of the editor state with this id: ${String(historyElementId)}`);
    }

    yield* call(restoreEditorState, entry.state);
}

function buildEditorStateHistory(history: EditorStateHistoryResponse): EditorStateHistoryEntry[] {
    const versions = rebuildEditorStateHistoryVersions(history);

    // Each version is described by what changed between the version before it, which is the next
    // one in the list since they go from the newest to the oldest, and itself
    return versions.map((version, index) => ({
        element: {
            id: version.patchId,
            date: new Date(version.date).toISOString(),
            activeTab: describeEditorStateModification(version.state, versions[index + 1]?.state ?? null),
        },
        state: denormalizeSerializedEditorState(version.state),
    }));
}

// Rebuilds the state of every version of the history, from the newest one, whose state is sent in
// full, to the oldest one that can still be reached: the patch of a version rebuilds its own state
// from the state of the version before it in the list
function rebuildEditorStateHistoryVersions(history: EditorStateHistoryResponse): {patchId: number, date: string, state: EditorStateSerialized}[] {
    const versions: {patchId: number, date: string, state: EditorStateSerialized}[] = [];

    let serializedState = history.state;
    for (let [index, patch] of history.patches.entries()) {
        if (0 < index) {
            if (null === serializedState || null === patch.patch) {
                break;
            }

            const previousSerializedState = applyEditorStatePatch(serializedState, patch.patch);
            if (null === previousSerializedState) {
                // The chain cannot be walked any further back
                break;
            }

            serializedState = previousSerializedState;
        }

        if (null === serializedState) {
            break;
        }

        versions.push({
            patchId: patch.patchId,
            date: patch.date,
            state: JSON.parse(serializedState) as EditorStateSerialized,
        });
    }

    return versions;
}

// Compares a version of the editor state with the version before it to tell what the user did:
// which tab they added, changed or removed, and how big that tab then was
function describeEditorStateModification(state: EditorStateSerialized, previousState: EditorStateSerialized|null): EditorStateHistoryElementTab {
    const sources = state.sources;
    const previousSources = previousState?.sources ?? [];
    const previousSourcesByTab = new Map(previousSources.map(source => [getSourceTabKey(source), source]));
    const sourcesByTab = new Map(sources.map(source => [getSourceTabKey(source), source]));

    const modifications: {type: EditorStateHistoryModificationType, source: EditorStateSerializedSource}[] = [
        ...sources
            .filter(source => !previousSourcesByTab.has(getSourceTabKey(source)))
            .map(source => ({type: EditorStateHistoryModificationType.AddTab, source})),
        ...sources
            .filter(source => {
                const previousSource = previousSourcesByTab.get(getSourceTabKey(source));

                return undefined !== previousSource && getSourceCode(previousSource) !== getSourceCode(source);
            })
            .map(source => ({type: EditorStateHistoryModificationType.ModifyTab, source})),
        ...previousSources
            .filter(source => !sourcesByTab.has(getSourceTabKey(source)))
            .map(source => ({type: EditorStateHistoryModificationType.DeleteTab, source})),
    ];

    // When several tabs changed at once, the tab the user was on is the one they were working in.
    // When no tab changed, the user only changed their tests, and the version is described by the
    // tab they were on
    const activeSource = sources.find(source => source.active) ?? sources[0];
    const modification = modifications.find(({source}) => source === activeSource)
        ?? modifications[0]
        ?? (undefined !== activeSource ? {type: EditorStateHistoryModificationType.ModifyTab, source: activeSource} : null);

    if (null === modification) {
        return {
            language: '',
            name: '',
            size: 0,
            modificationType: EditorStateHistoryModificationType.ModifyTab,
        };
    }

    return {
        language: platformsList[modification.source.language]?.name ?? modification.source.language,
        name: modification.source.name,
        size: getSourceCode(modification.source).length,
        modificationType: modification.type,
    };
}

// The versions hold no tab identifier, a tab is followed from a version to the next one by its name
// and its language: renaming a tab, or changing its language, reads as another tab
function getSourceTabKey(source: EditorStateSerializedSource): string {
    return `${source.language}\n${source.name}`;
}

function getSourceCode(source: EditorStateSerializedSource): string {
    return source.source.join('\n');
}

function denormalizeSerializedEditorState(state: EditorStateSerialized): EditorState {
    return {
        sources: state.sources.map(source => ({
            name: source.name,
            source: getSourceCode(source),
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
        // A code tab was edited, created, renamed, removed, or the user moved to another one
        bufferEdit,
        bufferEditPlain,
        bufferInit,
        bufferRemove,
        bufferChangeActiveBufferName,
        // A test was edited, created or removed
        updateTaskTest,
        addNewTaskTest,
        removeTaskTest,
    ], saveEditors);
}
