import {appSelect} from '../../hooks';
import {quickAlgoLibraries} from './quick_algo_libraries_model';
import log from 'loglevel';
import {extractLevelSpecific, extractVariantSpecific} from '../utils';
import {call, put} from 'typed-redux-saga';
import {importModules, importPlatformModules, loadFonts, loadMathJax} from './import_modules';
import {SmartContractLib} from './smart_contract/smart_contract_lib';
import {DefaultQuickalgoLibrary} from './default_quickalgo_library';
import {PrinterLib} from './printer/printer_lib';
import {createDisplayHelper} from './display_helper';
import {getAvailablePlatformsFromSupportedLanguages, hasBlockPlatform} from '../../stepper/platforms';
import {loadBlocklyHelperSaga} from '../../stepper/js';
import {
    selectCurrentTestData,
    taskIncreaseContextId,
    taskSetAvailablePlatforms,
    taskSetBlocksPanelCollapsed,
    taskSetContextIncludeBlocks,
    taskSetContextStrings,
    taskSetLevelGridInfos,
} from '../task_slice';
import {taskApi} from '../platform/platform';
import {ActionTypes as IOActionTypes} from '../../stepper/io/actionTypes';
import {IoMode} from '../../stepper/io';
import {ActionTypes as CommonActionTypes} from '../../common/actionTypes';
import {QuickAlgoLibrariesActionType, quickAlgoLibraryResetAndReloadStateSaga} from './quickalgo_libraries';
import {QuickAlgoLibrary} from './quickalgo_library';
import {DebugLib} from './debug/debug_lib';
import {QuickalgoLibraryInfos, QuickalgoTaskGridInfos} from '../task_types';
import {selectActiveBufferPlatform} from '../../buffers/buffer_selectors';
import {selectAvailableExecutionModes} from '../../submission/submission_selectors';
import {submissionChangeExecutionMode} from '../../submission/submission_slice';
import {OpenCvLib} from './opencv/opencv_lib';

const availableLibs = {
    'smart_contract': SmartContractLib,
    'printer': PrinterLib,
    'opencv': OpenCvLib,
};

export function* createQuickalgoLibrary(platformAlreadyChanged: boolean = false) {
    let state = yield* appSelect();
    let oldContext = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('libraries').debug('Create a context', state.environment);
    if (oldContext) {
        log.getLogger('libraries').debug('Unload initial context first');
        quickAlgoLibraries.unloadContext(state.environment);
    }

    const display = 'main' === state.environment;

    const currentTask = yield* appSelect(state => state.task.currentTask);
    const currentLevel = yield* appSelect(state => state.task.currentLevel);
    window.subTask = currentTask;

    let levelGridInfos: QuickalgoTaskGridInfos = {
        includeBlocks: {
            generatedBlocks: {
                printer: ["print", "read", "manipulate"]
            },
            standardBlocks: {
                includeAll: true,
            },
        },
    };
    if (currentTask) {
        levelGridInfos = extractLevelSpecific(currentTask.gridInfos, currentLevel);
        const taskVariant = state.options.taskVariant;
        if (null !== taskVariant && undefined !== taskVariant) {
            levelGridInfos = extractVariantSpecific(levelGridInfos, taskVariant, currentLevel);
        }
        const levelGridInfosCopy = JSON.parse(JSON.stringify(levelGridInfos));
        yield* put(taskSetLevelGridInfos(levelGridInfosCopy as unknown as QuickalgoLibraryInfos));
    }

    const platform = selectActiveBufferPlatform(state);
    if (!state.options.preload) {
        yield* call(importPlatformModules, platform, window.modulesPath);

        if (levelGridInfos.importModules) {
            yield* call(importModules, levelGridInfos.importModules, window.modulesPath);
        }
    }

    if (currentTask?.useLatex) {
        yield* call(loadMathJax);
    }

    yield* call(loadFonts, state.options.theme, currentTask);

    // Reset fully local strings when creating a new context to avoid keeping strings from an other language
    window.languageStrings = {};
    window.currentPlatform = platform;

    let contextLib;
    if (levelGridInfos.context) {
        if (!window.quickAlgoLibrariesList) {
            window.quickAlgoLibrariesList = [];
        }
        for (let [libName, libClass] of Object.entries(availableLibs)) {
            if (!window.quickAlgoLibrariesList.find(lib => libName === lib[0])) {
                window.quickAlgoLibrariesList.push([libName, (display, infos) => {
                    return new libClass(display, infos);
                }]);
            }
        }

        const libraryIndex = window.quickAlgoLibrariesList.findIndex(element => levelGridInfos.context === element[0]);
        if (-1 !== libraryIndex) {
            const contextFactory = window.quickAlgoLibrariesList[libraryIndex][1];
            try {
                contextLib = contextFactory(display, levelGridInfos);
                log.getLogger('libraries').debug('create new library', contextLib);
                quickAlgoLibraries.addLibrary(contextLib, levelGridInfos.context, state.environment);
            } catch (e) {
                console.error("Cannot create context", e);
                contextLib = new DefaultQuickalgoLibrary(display, levelGridInfos);
                quickAlgoLibraries.addLibrary(contextLib, 'default', state.environment);
            }
        }
    }
    if (!contextLib) {
        try {
            contextLib = new PrinterLib(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'printer', state.environment);
        } catch (e) {
            console.error("Cannot create context", e);
            contextLib = new DefaultQuickalgoLibrary(display, levelGridInfos);
            quickAlgoLibraries.addLibrary(contextLib, 'default', state.environment);
        }
    }

    const context = quickAlgoLibraries.getContext(null, state.environment);

    let availablePlatforms = context.getSupportedPlatforms();
    if (null !== currentTask && currentTask.supportedLanguages?.length && '*' !== currentTask.supportedLanguages) {
        const taskAvailablePlatforms = getAvailablePlatformsFromSupportedLanguages(currentTask.supportedLanguages);
        availablePlatforms = availablePlatforms.filter(platform => -1 !== taskAvailablePlatforms.indexOf(platform));
    }
    if (-1 === availablePlatforms.indexOf(state.options.platform) && availablePlatforms.length) {
        if (platformAlreadyChanged) {
            throw new Error("Platform has already changed once, cannot converge to a valid platform");
        }

        yield* put({type: CommonActionTypes.PlatformChanged, payload: {platform: availablePlatforms[0], reloadTask: true}});

        return yield* call(createQuickalgoLibrary, true);
    }

    yield* put(taskSetAvailablePlatforms(availablePlatforms));

    // Set submission mode
    const availableExecutionModes = yield* appSelect(selectAvailableExecutionModes);
    if (-1 === availableExecutionModes.indexOf(state.submission.executionMode) && availableExecutionModes.length) {
        yield* put(submissionChangeExecutionMode(availableExecutionModes[0]));
    }

    log.getLogger('libraries').debug('created context', context);
    context.iTestCase = state.task.currentTestId;
    context.environment = state.environment;
    // For QuickPi lib, with this option, the program is graded even when context.display = false
    // (which happens in particular in the case of a replay)
    context.forceGradingWithoutDisplay = 'background' !== state.environment;
    yield* call(addCustomBlocksToQuickalgoLibrary, context, display, levelGridInfos);

    if (context.changeSoundEnabled) {
        context.changeSoundEnabled('main' === state.environment ? state.task.soundEnabled : false);
    }

    yield* call(createDisplayHelper);
    if (hasBlockPlatform(selectActiveBufferPlatform(state)) && currentTask) {
        yield* call(loadBlocklyHelperSaga, context);
    } else {
        // Create a fake blockly helper to make other libs like Turtle work
        context.blocklyHelper = {
            fake: true,
            updateSize() {

            },
        };
    }

    const testData = selectCurrentTestData(state);
    log.getLogger('libraries').debug('Created context with', {currentTask, currentLevel, testData, context});
    taskApi.displayedSubTask = {
        context,
    };
    if (context instanceof PrinterLib && currentTask) {
        yield* put({type: IOActionTypes.IoPaneModeChanged, payload: {mode: IoMode.Split}});
    }
    yield* put(taskIncreaseContextId());
    yield* put(taskSetContextStrings(context.strings));
    if (context.infos && context.infos.includeBlocks) {
        // Don't freeze any objet inside context.infos.includeBlocks because
        // these objects can be modified by blockly_blocks.js,
        // for example for Scratch: `tsiSingleBlocks = this.blocksToScratch(tsiSingleBlocks);`
        yield* put(taskSetContextIncludeBlocks(JSON.parse(JSON.stringify(context.infos.includeBlocks))));
    }
    if (context.infos && context.infos.panelCollapsed) {
        yield* put(taskSetBlocksPanelCollapsed({collapsed: true, manual: true}));
    }

    yield* call(quickAlgoLibraryResetAndReloadStateSaga);
    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});

    return true;
}

export function* addCustomBlocksToQuickalgoLibrary(context: QuickAlgoLibrary, display, gridInfos) {
    const debugLib = new DebugLib(display, gridInfos);
    yield* call(mergeQuickalgoLibrary, 'debug', context, debugLib);
}

export function* mergeQuickalgoLibrary(libName: string, parentContext: QuickAlgoLibrary, childContext: QuickAlgoLibrary) {
    const environment = yield* appSelect(state => state.environment);
    quickAlgoLibraries.addLibrary(childContext, libName, environment);

    parentContext.childContexts.push(childContext);

    const fieldsToMerge = [
        'customBlocks',
        'customConstants',
        'customClasses',
        'customClassInstances',
        'notionsList',
    ];

    for (let fieldToMerge of fieldsToMerge) {
        parentContext[fieldToMerge] = {
            ...parentContext[fieldToMerge],
            ...childContext[fieldToMerge],
        };
    }

    parentContext.strings = window.languageStrings;

    // Copy handlers
    for (let generatorName in childContext.customBlocks) {
        // Execute function in the context of the child
        parentContext[generatorName] = {};
        for (let [name, method] of Object.entries<Function>(childContext[generatorName])) {
            parentContext[generatorName][name] = function () {
                return method.apply(childContext, arguments);
            };
        }
    }
}
