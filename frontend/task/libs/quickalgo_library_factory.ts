import {appSelect} from '../../hooks';
import {quickAlgoLibraries} from './quick_algo_libraries_model';
import log from 'loglevel';
import {extractLevelSpecific, extractVariantSpecific} from '../utils';
import {call, put} from 'typed-redux-saga';
import {importModules, importPlatformModules, loadFonts} from './import_modules';
import {SmartContractLib} from './smart_contract/smart_contract_lib';
import {DefaultQuickalgoLibrary} from './default_quickalgo_library';
import {PrinterLib} from './printer/printer_lib';
import {createDisplayHelper} from './display_helper';
import {hasBlockPlatform} from '../../stepper/platforms';
import {loadBlocklyHelperSaga} from '../../stepper/js';
import {
    selectCurrentTestData,
    taskIncreaseContextId,
    taskSetAvailablePlatforms,
    taskSetBlocksPanelCollapsed,
    taskSetContextIncludeBlocks,
    taskSetContextStrings
} from '../task_slice';
import {taskApi} from '../platform/platform';
import {ActionTypes as IOActionTypes} from '../../stepper/io/actionTypes';
import {IoMode} from '../../stepper/io';
import {ActionTypes as CommonActionTypes} from '../../common/actionTypes';
import {QuickAlgoLibrariesActionType, quickAlgoLibraryResetAndReloadStateSaga} from './quickalgo_libraries';
import {QuickAlgoLibrary} from './quickalgo_library';
import {DebugLib} from './debug/debug_lib';
import {QuickalgoTaskGridInfos} from '../task_types';

export function* createQuickalgoLibrary() {
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
    }

    if (!state.options.preload) {
        const platform = state.options.platform
        yield* call(importPlatformModules, platform, window.modulesPath);

        if (levelGridInfos.importModules) {
            yield* call(importModules, levelGridInfos.importModules, window.modulesPath);
        }
    }
    yield* call(loadFonts, state.options.theme, currentTask);

    // Reset fully local strings when creating a new context to avoid keeping strings from an other language
    window.languageStrings = {};

    let contextLib;
    if (levelGridInfos.context) {
        if (!window.quickAlgoLibrariesList) {
            window.quickAlgoLibrariesList = [];
        }
        if (!window.quickAlgoLibrariesList.find(lib => 'smart_contract' === lib[0])) {
            window.quickAlgoLibrariesList.push(['smart_contract', (display, infos) => {
                return new SmartContractLib(display, infos);
            }]);
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
        availablePlatforms = availablePlatforms.filter(platform => -1 !== currentTask.supportedLanguages.split(',').indexOf(platform));
    }
    if (-1 === availablePlatforms.indexOf(state.options.platform) && availablePlatforms.length) {
        yield* put({type: CommonActionTypes.PlatformChanged, payload: {platform: availablePlatforms[0], reloadTask: true}});

        return false;
    }


    yield* put(taskSetAvailablePlatforms(availablePlatforms));

    log.getLogger('libraries').debug('created context', context);
    context.iTestCase = state.task.currentTestId;
    context.environment = state.environment;
    // For QuickPi lib, with this option, the program is graded even when context.display = false
    // (which happens in particular in the case of a replay)
    context.forceGradingWithoutDisplay = true;
    yield* call(addCustomBlocksToQuickalgoLibrary, context, display, levelGridInfos);

    if (context.changeSoundEnabled) {
        context.changeSoundEnabled('main' === state.environment ? state.task.soundEnabled : false);
    }

    yield* call(createDisplayHelper);
    if (hasBlockPlatform(state.options.platform) && currentTask) {
        yield* call(loadBlocklyHelperSaga, context, currentLevel);
    } else {
        // Create a fake blockly helper to make other libs like Turtle work
        context.blocklyHelper = {
            updateSize() {

            },
        };
    }

    const testData = selectCurrentTestData(state);
    log.getLogger('libraries').debug('Created context with', {currentTask, currentLevel, testData, context});
    taskApi.displayedSubTask = {
        context,
    };
    // if (!context.blocklyHelper) {
    //     context.blocklyHelper = {
    //         updateSize: () => {},
    //     };
    // }
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
        yield* put(taskSetBlocksPanelCollapsed({collapsed: false, manual: true}));
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

    parentContext.customBlocks = {
        ...parentContext.customBlocks,
        ...childContext.customBlocks,
    };

    parentContext.notionsList = {
        ...parentContext.notionsList,
        ...childContext.notionsList,
    };

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
