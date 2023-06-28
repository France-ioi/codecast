import {appSelect} from '../../hooks';
import {quickAlgoLibraries} from './quick_algo_libraries_model';
import log from 'loglevel';
import {extractLevelSpecific} from '../utils';
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
import {QuickAlgoLibrariesActionType} from './quickalgo_libraries';

export function* createQuickalgoLibrary() {
    let state = yield* appSelect();
    let context = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('libraries').debug('Create a context', context, state.environment);
    if (context) {
        log.getLogger('libraries').debug('Unload initial context first');
        quickAlgoLibraries.unloadContext(state.environment);
    }

    const display = 'main' === state.environment;

    const currentTask = yield* appSelect(state => state.task.currentTask);
    const currentLevel = yield* appSelect(state => state.task.currentLevel);
    window.subTask = currentTask;

    let contextLib;
    let levelGridInfos = currentTask ? extractLevelSpecific(currentTask.gridInfos, currentLevel) : {
        includeBlocks: {
            generatedBlocks: {
                printer: ["print", "read", "manipulate"]
            },
            standardBlocks: {
                includeAll: true,
            },
        },
    };

    if (!state.options.preload) {
        const platform = state.options.platform
        yield* call(importPlatformModules, platform, window.modulesPath);

        if (levelGridInfos.importModules) {
            yield* call(importModules, levelGridInfos.importModules, window.modulesPath);
        }
    }
    yield* call(loadFonts, state.options.theme, currentTask);

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

    log.getLogger('libraries').debug('created context', contextLib);
    contextLib.iTestCase = state.task.currentTestId;
    contextLib.environment = state.environment;
    // For QuickPi lib, with this option, the program is graded even when context.display = false
    // (which happens in particular in the case of a replay)
    contextLib.forceGradingWithoutDisplay = true;

    if (contextLib.changeSoundEnabled) {
        contextLib.changeSoundEnabled('main' === state.environment ? state.task.soundEnabled : false);
    }

    yield* call(createDisplayHelper);
    if (hasBlockPlatform(state.options.platform) && currentTask) {
        yield* call(loadBlocklyHelperSaga, contextLib, currentLevel);
    } else {
        // Create a fake blockly helper to make other libs like Turtle work
        contextLib.blocklyHelper = {
            updateSize() {

            },
        };
    }

    const testData = selectCurrentTestData(state);
    log.getLogger('libraries').debug('Create context with', {currentTask, currentLevel, testData});
    context = quickAlgoLibraries.getContext(null, state.environment);
    log.getLogger('libraries').debug('Created context', context);
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
        yield* put(taskSetContextIncludeBlocks({...context.infos.includeBlocks}));
    }
    if (context.infos && context.infos.panelCollapsed) {
        yield* put(taskSetBlocksPanelCollapsed({collapsed: false, manual: true}));
    }

    let availablePlatforms = context.getSupportedPlatforms();
    if (null !== currentTask && currentTask.supportedLanguages && currentTask.supportedLanguages.length) {
        availablePlatforms = availablePlatforms.filter(platform => -1 !== currentTask.supportedLanguages.indexOf(platform));
    }
    if (-1 === availablePlatforms.indexOf(state.options.platform) && availablePlatforms.length) {
        yield* put({
            type: CommonActionTypes.PlatformChanged,
            payload: {platform: availablePlatforms[0], reloadTask: true}
        });

        return false;
    }

    yield* put(taskSetAvailablePlatforms(availablePlatforms));

    context.resetAndReloadState(testData, state);
    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});

    return true;
}
