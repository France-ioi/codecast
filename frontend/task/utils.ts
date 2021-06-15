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
