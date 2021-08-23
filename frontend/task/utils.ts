import {quickAlgoLibraries} from "./libs/quickalgo_librairies";

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

export function checkCompilingCode(code, getMessage) {
    if (!code) {
        throw getMessage('EMPTY_PROGRAM');
    }

    const context = quickAlgoLibraries.getContext();
    if (context) {
        const availableModules = getAvailableModules(context);
        for (let availableModule of availableModules) {
            if ('printer' === availableModule) {
                // Printer lib is optional
                continue;
            }
            let match = (new RegExp('from\\s+' + availableModule + '\\s+import\\s+\\*')).exec(code);
            if (null === match) {
                throw getMessage('PROGRAM_MISSING_LIB').format({line: `<code>from ${availableModule} import *</code>`});
            }
        }
    }
}
