import {TaskLevelName} from './platform/platform_slice';
import {QuickAlgoLibrary} from './libs/quickalgo_library';
import {TaskHint} from './hints/hints_slice';

export interface BlocksUsage {
    error?: string,
    blocksLimit?: number,
    blocksCurrent?: number,
    limitations?: {name: string, current: number, limit: number}[],
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
    currentTestId?: number|null,
    previousTestId?: number,
    inputNeeded?: boolean,
    inputs?: any[],
    contextId: number,
    contextStrings: any,
    contextIncludeBlocks: QuickalgoTaskIncludeBlocks,
    availablePlatforms: string[],
    blocksPanelCollapsed?: boolean,
    blocksPanelWasOpen?: boolean,
    blocksUsage?: BlocksUsage,
    soundEnabled?: boolean,
    menuHelpsOpen?: boolean,
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
    originalGroupByCategory?: boolean,
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
    images?: {id?: string, path: {default: string}}[],
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
    hiddenTests?: boolean,
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
}

export interface QuickalgoTaskGridInfos extends QuickalgoTaskGridInfosNotLevelDependent {
    maxInstructions?: number|{[level: string]: number},
    startingExample?: any,
    limitedUses?: {[level: string]: {blocks: string[], nbUses: number}[]},
    includeBlocks?: QuickalgoTaskIncludeBlocksAllLevels,
}

export interface QuickalgoLibraryInfos extends QuickalgoTaskGridInfosNotLevelDependent {
    maxInstructions?: number,
    startingExample: any,
    limitedUses?: {blocks: string[], nbUses: number}[],
    includeBlocks?: QuickalgoTaskIncludeBlocks,
}

export interface QuickalgoTask {
    gridInfos: QuickalgoTaskGridInfos,
    data?: any,
}

export interface TaskNormalized {
    id: string,
    textId: string,
    supportedLanguages: string,
    author: string,
    showLimits: boolean,
    userTests: boolean,
    isEvaluable: boolean,
    scriptAnimation: string,
    hasSubtasks: boolean,
}

export interface TaskLimitNormalized {
    id: string,
    taskId: string,
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

export interface TaskServer extends TaskNormalized {
    limits: TaskLimitNormalized[],
    strings: TaskStringNormalized[],
    subTasks: TaskSubtaskNormalized[],
    tests: TaskTestServer[],
}

export type Task = QuickalgoTask & Partial<TaskServer>;

export function isServerTask(object: Task): boolean {
    return null !== object.id && undefined !== object.id;
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
