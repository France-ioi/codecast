import {quickAlgoLibraries} from "./libs/quickalgo_librairies";
import {current, isDraft} from "immer";
import {checkPythonCode} from "./python_utils";
import {getMessage} from "../lang";
import {AppStore, CodecastPlatform} from "../store";

export function extractLevelSpecific(item, level) {
    if ((typeof item != "object")) {
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

export function checkCompilingCode(code, platform: CodecastPlatform, state: AppStore) {
    if (!code) {
        throw getMessage('CODE_CONSTRAINTS_EMPTY_PROGRAM');
    }

    if (CodecastPlatform.Python === platform) {
        const context = quickAlgoLibraries.getContext(null, state.environment);
        if (context) {
            checkPythonCode(code, context, state);
        }
    }
}

export function getDefaultSourceCode(platform: CodecastPlatform, environment: string) {
    if (CodecastPlatform.Python === platform) {
        const context = quickAlgoLibraries.getContext(null, environment);
        if (context) {
            const availableModules = getAvailableModules(context);
            let content = '';
            for (let i = 0; i < availableModules.length; i++) {
                content += 'from ' + availableModules[i] + ' import *\n';
            }
            return content;
        }
    }

    return '';
}

export function getCurrentImmerState(object) {
    return Object.fromEntries(
        Object.entries(object).map(
            ([k, v]) => [k, isDraft(v) ? current(v) : v],
        )
    )
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
