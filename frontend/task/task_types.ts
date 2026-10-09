import {TaskLevelName} from './platform/platform_slice';
import {QuickAlgoLibrary} from './libs/quickalgo_library';
import {TaskHint} from './hints/hints_slice';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {Document, GitSyncParams} from '../buffers/buffer_types';

export interface BlocksUsage {
    error?: string,
    blocksLimit?: number,
    blocksCurrent?: number,
    limitations?: {name: string, current: number, limit: number, type: string}[],
}

export interface TaskState {
    currentTask?: Task|null,
    currentLevel?: TaskLevelName|null,
    recordingEnabled?: boolean,
    resetDone?: boolean,
    loaded?: boolean,
    state?: any,
    success?: boolean,
    successMessage?: string,
    taskTests: TaskTest[],
    currentTestId?: number|null, // current test id is the index of the current test in the list of filtered task tests corresponding to the current level
    previousTestId?: number,
    inputNeeded?: boolean,
    inputs?: any[],
    contextId: number,
    contextStrings: any,
    contextIncludeBlocks: QuickalgoTaskIncludeBlocks,
    availablePlatforms: string[],
    blocksPanelCollapsed?: boolean,
    blocksPanelWasCollapsed?: boolean,
    blocksUsage?: BlocksUsage,
    soundEnabled?: boolean,
    menuHelpsOpen?: boolean,
    levelGridInfos: QuickalgoLibraryInfos|null,
}

export enum TaskTestGroupType {
    Example = 'Example',
    User = 'User',
    Evaluation = 'Evaluation',
    Submission = 'Submission',
}

export interface TaskTest {
    id?: string,
    subtaskId?: string|null,
    groupType?: TaskTestGroupType,
    active?: boolean,
    name?: string,
    shortName?: string,
    data: any,
    contextState: any,
    contextStateResetDone?: boolean,
    level?: TaskLevelName,
}

export interface QuickalgoTaskIncludeBlocks {
    groupByCategory?: boolean,
    generatedBlocks?: {[context: string]: string[]},
    standardBlocks?: {
        includeAll?: boolean,
        includeAllPython?: boolean,
        wholeCategories?: string[],
        singleBlocks?: string[],
    },
    variables?: string[],
    pythonAdditionalFunctions?: string[],
    procedures?: {ret: boolean, noret: boolean, disableArgs?: boolean},
    pythonForceAllowed?: string[],
    pythonForceForbidden?: string[],
}

// We can customize the option for each level in the task definition
export interface QuickalgoTaskIncludeBlocksAllLevels {
    groupByCategory?: boolean|{[level: string]: boolean},
    generatedBlocks?: {[context: string]: string[]}|{[context: string]: {[level: string]: string[]}},
    standardBlocks?: {
        includeAll?: boolean,
        wholeCategories?: string[]|{[level: string]: string[]},
        singleBlocks?: string[]|{[level: string]: string[]},
    },
    variables?: string[]|{[level: string]: string[]},
    pythonAdditionalFunctions?: string[],
}

export interface QuickalgoTaskGridInfosNotLevelDependent {
    context?: string,
    contextType?: string,
    images?: {id?: string, path: string}[],
    importModules?: string[],
    conceptViewer?: boolean|string[],
    conceptViewerBaseUrl?: string|null,
    backgroundColor?: string,
    backgroundSrc?: string,
    borderColor?: string,
    showLabels?: boolean,
    logOption?: boolean,
    unlockedLevels?: number,
    blocklyColourTheme?: string,
    zoom?: {wheel?: boolean, controls?: boolean, scale?: number},
    scrollbars?: boolean,
    intro?: any,
    hideSaveOrLoad?: boolean,
    actionDelay?: number,
    panelCollapsed?: boolean,
    checkEndCondition?: (context: QuickAlgoLibrary, lastTurn: any) => void,
    computeGrade?: (context: QuickAlgoLibrary, message: unknown) => {successRate: number, message: string},
    checkEndEveryTurn?: boolean,
    maxListSize?: number,
    placeholderBlocks?: any,
    usedSkills?: string[],
    targetNbInstructions?: number,
    forceNextTaskAfter?: number,
    defaultLevel?: TaskLevelName,
    expectedStorage?: string,
    initActionDelay?: number,
    hints?: TaskHint[],
    taskStrings?: any,
    showViews?: boolean,
    tabsEnabled?: boolean,
    remoteDebugEnabled?: boolean,
    hideVariantsInDocumentation?: boolean,
    blocksLanguage?: {[platform: string]: string},
    multithread?: boolean,
    allowClientExecution?: boolean,
    codeHelpAdditionalContext?: string,
    showIfMutator?: boolean,
}

export interface QuickalgoTaskGridInfos extends QuickalgoTaskGridInfosNotLevelDependent {
    maxInstructions?: number|{[level: string]: number},
    startingExample?: {[platform: string]: any},
    limitedUses?: {[level: string]: {blocks: string[], nbUses: number}[]},
    includeBlocks?: QuickalgoTaskIncludeBlocksAllLevels,
    hiddenTests?: boolean|{[level: string]: boolean},
    documentationOpenByDefault?: boolean|{[level: string]: boolean},
}

export interface QuickalgoLibraryInfos extends QuickalgoTaskGridInfosNotLevelDependent {
    maxInstructions?: number,
    startingExample: any,
    limitedUses?: {blocks: string[], nbUses: number}[],
    includeBlocks?: QuickalgoTaskIncludeBlocks,
    hiddenTests?: boolean,
    documentationOpenByDefault?: boolean,
}

export interface QuickalgoTask {
    gridInfos: QuickalgoTaskGridInfos,
    data?: any,
    animationExampleCmds?: any,
    animationFeatures?: (selector: any) => void,
}

export interface TaskNormalized {
    id: string,
    textId: string,
    supportedLanguages: string,
    author: string,
    showLimits: boolean,
    userTests: boolean,
    useLatex: boolean,
    isEvaluable: boolean,
    scriptAnimation: string,
    hasSubtasks: boolean,
}

export interface TaskLimitNormalized {
    id?: string,
    taskId?: string,
    language: string,
    maxTime: number,
    maxMemory: number,
}

export interface TaskStringNormalized {
    id: string,
    taskId: string,
    language: string,
    title: string,
    statement: string,
    solution: string | null,
}

export interface TaskSubtaskNormalized {
    id: string,
    taskId: string,
    rank: number,
    name: string,
    comments: string | null,
    pointsMax: number,
    active: boolean,
}

export interface TaskTestServer {
    id: string,
    taskId: string,
    subtaskId: string | null,
    submissionId: string | null,
    groupType: TaskTestGroupType,
    userId: string | null,
    platformId: string | null,
    rank: number,
    active: boolean,
    name: string,
    input: string,
    output: string,
    clientId?: string | null,
}

export interface TaskAnswer {
    version?: string,
    document: Document,
    platform?: CodecastPlatform,
    fileName?: string,
    gitSync?: GitSyncParams,
    compressed?: boolean,
    //submissionId: string ?
}

// The saved state of the editor of a user on a task: the content of their code tabs and their tests
export interface EditorStateSource {
    name: string,
    source: string,
    language: string,
    active: boolean,
}

export interface EditorStateTest {
    name: string,
    input: string,
    output: string,
    active: boolean,
    clientId: string,
}

export interface EditorState {
    sources: EditorStateSource[],
    // A null tests list means the task has no user tests
    tests: EditorStateTest[]|null,
}

export interface EditorStateHistoryTag {
    identifier: string,
    i18nText?: string,
}

// A save of the editor state, as described to the platform by task.getHistory
export interface EditorStateHistoryElement {
    // Goes up by one at each save of the attempt
    id: number,
    // RFC 3339, precise to the second
    datetime: string,
    // When it is a checkpoint, some of them tell why
    tags: EditorStateHistoryTag[],
    // The user who made this save, several users share a history in team solving
    idUser: string,
    isCheckpoint: boolean,
    // The characters added and removed since the previous save, or since the empty answer for the
    // first save
    sinceEarlier: {
        charsAdded: number,
        charsRemoved: number,
    },
    // Only for a checkpoint: the characters added and removed since the previous checkpoint (or since
    // the empty answer for the first checkpoint), and the number of saves between them
    sinceEarlierCheckpoint?: {
        charsAdded: number,
        charsRemoved: number,
        elementsCount: number,
    },
    // The code tab the user was on, null when there was none
    activeTab: {
        // Null when the task has no tabs
        name: string|null,
        // Characters for a text language, blocks for a block language
        length: number,
        // The display name of the language: Python, Java...
        progLang: string,
    }|null,
}

// The options of task.getHistory
export interface EditorStateHistoryOptions {
    // 100 by default, 1000 at most
    limit?: number,
    // The maximum id, included
    maxId?: number,
    // The minimum id, excluded
    minId?: number,
    onlyCheckpoints?: boolean,
}

// The options of task.reloadHistory
export interface EditorStateReloadHistoryOptions {
    elementId: number,
}

// What a save changed, derived from its state and the state of the save before it
export interface EditorStateHistoryDescription {
    // The code tab the user was on, null when there was none
    activeTab: {
        name: string,
        // As Codecast names it: python, blockly...
        language: string,
        // Characters for a text language, blocks for a block language
        length: number,
    }|null,
    // Whether the user was on another tab at the save before
    activeTabChanged: boolean,
    // The characters of the code tabs added and removed since the save before
    modificationDeltas: {
        added: number,
        removed: number,
    },
}

export interface EditorStateHistoryPatch {
    id: number,
    date: string,
    idUser: string,
    // The reverse patch that rebuilds the state of this save from the state of the save after it
    patch: string|null,
}

// A page of the chain of saves, newest first
export interface EditorStateHistoryResponse {
    // The serialized state of the newest save of the chain, when the page starts with it
    state: string|null,
    patches: EditorStateHistoryPatch[],
}

// The part of the chain of saves fetched so far: it goes from the newest save down, without gap,
// since the state of a save is rebuilt from the state of the save after it
export interface EditorStateHistoryCache {
    // The task and the attempt this chain belongs to
    key: string,
    headState: string|null,
    // The descriptions of the saves, by id. A save is described once the state of the save before
    // it has been rebuilt, so the oldest fetched save is only described when it is the first one
    descriptions: {[id: number]: EditorStateHistoryDescription},
    // The oldest state rebuilt so far, from which the older saves are described as they are fetched
    oldestRebuiltState: {id: number, state: string}|null,
    patches: EditorStateHistoryPatch[],
    // Whether the chain has been fetched down to its first save
    complete: boolean,
}

export interface TaskServer extends TaskNormalized {
    limits: TaskLimitNormalized[],
    strings: TaskStringNormalized[],
    subTasks: TaskSubtaskNormalized[],
    sourceCodes: SourceCodeNormalized[],
    tests: TaskTestServer[],
    // Last state of the editor saved by the user of the token, null when there is no token or when
    // this user has never saved anything on this task
    editorState: EditorState|null,
}

export interface SourceCodeParams {
    sLangProg: string,
}

export interface SourceCodeNormalized {
    id: string,
    params: SourceCodeParams|null,
    date: string,
    name: string,
    source: string,
    editable: boolean,
    active: boolean,
    rank: number,
    type: string,
}

export interface TaskTokenPayload {
    idUser: string,
    idAttempt?: string,
    itemUrl: string,
    platformName: string,
    randomSeed: string,
    date: string,
    bAccessSolutions: boolean,
    bHintsAllowed: boolean,
    bSubmissionPossible: boolean,
}

export type Task = QuickalgoTask & Partial<TaskServer> & {codecastParameters?: any};

export function isServerTask(object: Task|null): boolean {
    return !!((object && null !== object.id && undefined !== object.id) || window.PEMTaskMetaData);
}

export function isServerTest(object: TaskTest): boolean {
    return null !== object.groupType && undefined !== object.groupType;
}

// TODO: update this function when we will have a "public" field in tm_task_tests
export function isTestPublic(test: TaskTest|null): boolean {
    if (!test || !isServerTest(test)) {
        return true;
    }

    return !(test && test.data && null === test.data.input);
}
