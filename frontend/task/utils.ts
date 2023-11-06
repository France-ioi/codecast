import {current, isDraft} from "immer";
import {checkPythonCode, getPythonBlocksUsage} from "./python_utils";
import {getMessage} from "../lang";
import {AppStore} from "../store";
import {checkBlocklyCode, getBlocklyBlocksUsage} from "../stepper/js";
import {TaskLevelName, taskLevelsList} from './platform/platform_slice';
import {isServerTask, Task, TaskAnswer} from './task_types';
import {hasBlockPlatform, platformsList} from '../stepper/platforms';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';
import {BlockBufferHandler, documentToString, TextBufferHandler} from '../buffers/document';
import {BlockDocument, BufferType, Document} from '../buffers/buffer_types';

export enum TaskPlatformMode {
    Source = 'source',
    RecordingProgress = 'recording_progress',
}


export const recordingProgressSteps = 10;

export function getTaskPlatformMode(state: AppStore): TaskPlatformMode {
    return !state.task.currentTask && state.player.instants ? TaskPlatformMode.RecordingProgress : TaskPlatformMode.Source;
}

export function extractLevelSpecific(item: any, level: TaskLevelName) {
    if ((typeof item !== "object")) {
        return item;
    }
    if (Array.isArray(item)) {
        return item.map((val) => {
            return extractLevelSpecific(val, level);
        });
    }
    if (item.shared === undefined) {
        if (item[level] === undefined) {
            let newItem = {};
            for (let prop in item) {
                newItem[prop] = extractLevelSpecific(item[prop], level);
            }
            return newItem;
        }
        return extractLevelSpecific(item[level], level);
    }
    if (Array.isArray(item.shared)) {
        let newItem = [];
        for (let iElem = 0; iElem < item.shared.length; iElem++) {
            newItem.push(extractLevelSpecific(item.shared[iElem], level));
        }
        if (item[level] != undefined) {
            if (!Array.isArray(item[level])) {
                console.error("Incompatible types when merging shared and " + level);
            }
            for (let iElem = 0; iElem < item[level].length; iElem++) {
                newItem.push(extractLevelSpecific(item[level][iElem], level));
            }
        }
        return newItem;
    }
    if (typeof item.shared == "object") {
        let newItem = {};
        for (let prop in item.shared) {
            newItem[prop] = extractLevelSpecific(item.shared[prop], level);
        }
        if (item[level] != undefined) {
            if (typeof item[level] != "object") {
                console.error("Incompatible types when merging shared and " + level);
            }
            for (let prop in item[level]) {
                newItem[prop] = extractLevelSpecific(item[level][prop], level);
            }
        }
        return newItem;
    }
    console.error("Invalid type for shared property");
}

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

export function getParamNames(func) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

    return null === result ? [] : result;
}

export function extractVariantSpecific(item: any, variant: number, level?: TaskLevelName): any {
    if (typeof item === 'function') {
        const params = getParamNames(item);
        if (-1 === params.indexOf('variant')) {
            return item;
        }

        const args = params.map((name) => {
            if ('variant' === name) {
                return variant;
            } else if ('level' === name) {
                return level;
            } else {
                return null;
            }
        });

        return item.apply(null, args);
    }
    if ((typeof item !== "object")) {
        return item;
    }
    if (Array.isArray(item)) {
        return item.map((val) => {
            return extractVariantSpecific(val, variant, level);
        });
    }
    if (item[`variant_${variant}`] === undefined) {
        let newItem = {};
        for (let prop in item) {
            newItem[prop] = extractVariantSpecific(item[prop], variant, level);
        }
        return newItem;
    } else {
        return extractVariantSpecific(item[`variant_${variant}`], variant, level);
    }
}

export function getAvailableModules(context) {
    if (context.infos.includeBlocks && context.infos.includeBlocks.generatedBlocks) {
        let availableModules = [];
        for (let generatorName in context.infos.includeBlocks.generatedBlocks) {
            if (context.infos.includeBlocks.generatedBlocks[generatorName].length) {
                availableModules.push(generatorName);
            }
        }
        return availableModules;
    } else {
        return [];
    }
}

export function checkCompilingCode(answer: TaskAnswer|null, state: AppStore, disabledValidations: string[] = []) {
    if (null === answer) {
        if (-1 === disabledValidations.indexOf('empty')) {
            throw getMessage('CODE_CONSTRAINTS_EMPTY_PROGRAM');
        }

        return;
    }

    const {document, platform} = answer;
    const context = quickAlgoLibraries.getContext(null, state.environment);
    if (context && state.task.currentTask) {
        if (CodecastPlatform.Python === platform && BufferType.Text === document.type) {
            checkPythonCode(documentToString(document), context, state, disabledValidations);
        }
        if (hasBlockPlatform(platform)) {
            checkBlocklyCode(document as BlockDocument, context, state, disabledValidations);
        }
    }
}

export function getBlocksUsage(answer: TaskAnswer|null) {
    const context = quickAlgoLibraries.getContext(null, 'main');
    if (!context) {
        return null;
    }

    const {document, platform} = answer;

    if (CodecastPlatform.Python === platform) {
        return getPythonBlocksUsage(documentToString(document), context);
    }
    if (hasBlockPlatform(platform)) {
        return getBlocklyBlocksUsage(document as BlockDocument, context);
    }

    return null;
}

export function getDefaultSourceCode(platform: CodecastPlatform, environment: string, currentTask?: Task): Document|null {
    const context = quickAlgoLibraries.getContext(null, environment);
    if (hasBlockPlatform(platform)) {
        if (context?.infos?.startingExample && platform in context?.infos?.startingExample) {
            return BlockBufferHandler.documentFromObject({blockly: context.infos.startingExample[platform]});
        } else if (context?.blocklyHelper && !context.blocklyHelper.fake) {
            return BlockBufferHandler.documentFromObject({blockly: context.blocklyHelper.getDefaultContent()});
        } else {
            return BlockBufferHandler.documentFromObject({blockly: '<xml></xml>'});
        }
    }

    if (CodecastPlatform.Python === platform) {
        if (context && currentTask && !isServerTask(currentTask)) {
            const availableModules = getAvailableModules(context);
            let content = '';
            for (let i = 0; i < availableModules.length; i++) {
                content += 'from ' + availableModules[i] + ' import *\n';
            }
            return TextBufferHandler.documentFromString(content);
        }
    }

    return TextBufferHandler.documentFromString('');
}

export function getCurrentImmerState(object) {
    return isDraft(object) ? current(object) : object;
}

export function formatTaskInstructions(instructions: string, platform: CodecastPlatform, taskLevel?: TaskLevelName, taskVariant?: number) {
    const instructionsJQuery = window.jQuery(`<div>${instructions}</div>`);
    for (let availablePlatform of Object.keys(platformsList)) {
        if (platform !== availablePlatform) {
            instructionsJQuery.find(`[data-lang~="${availablePlatform}"]:not([data-lang~="${platform}"]`).remove();
        }
    }
    instructionsJQuery.find('.advice').attr('data-title', getMessage('TRALALERE_ADVICE'));
    for (let availableLevel of taskLevelsList) {
        if (taskLevel !== availableLevel) {
            instructionsJQuery.find(`.${availableLevel}:not(.${taskLevel})`).remove();
        }
    }

    instructionsJQuery.find(`[class^="variant_"]:not(.variant_${taskVariant})`).remove();

    instructionsJQuery.find('[data-current-lang]').html(getMessage('PLATFORM_' + platform.toLocaleUpperCase()).s);

    return instructionsJQuery;
}

// These functions are for retro-compatibility with blockly_block.js
/// -- START ---
window.debounce = function(fn, threshold, wait) {
    let timeout;

    return function debounced() {
        if (timeout) {
            if(wait) {
                clearTimeout(timeout);
            } else {
                return;
            }
        }
        function delayed() {
            fn();
            timeout = null;
        }
        timeout = setTimeout(delayed, threshold || 100);
    }
}
window.arrayContains = function(array, needle) {
    for (let index in array) {
        if (needle == array[index]) {
            return true;
        }
    }
    return false;
};
window.mergeIntoArray = function(into, other) {
    for (let iOther in other) {
        let intoContains = false;

        for (let iInto in into) {
            if (other[iOther] == into[iInto]) {
                intoContains = true;
            }
        }

        if (!intoContains) {
            into.push(other[iOther]);
        }
    }
}
window.mergeIntoObject = function (into, other) {
    for (let property in other) {
        if (other[property] instanceof Array) {
            if (!(into[property] instanceof Array)) {
                into[property] = [];
            }
            window.mergeIntoArray(into[property], other[property]);
        }
        if (other[property] instanceof Object) {
            if (!(into[property] instanceof Object)) {
                into[property] = {};
            }
            window.mergeIntoObject(into[property], other[property]);
        }
        into[property] = other[property];
    }
}
/// -- END ---
