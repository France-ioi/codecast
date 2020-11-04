export const isLoaded = function(loadedReferences, variable) {
    return (variable.cur.hasOwnProperty('_uuid') && loadedReferences.hasOwnProperty(variable.cur._uuid));
};
