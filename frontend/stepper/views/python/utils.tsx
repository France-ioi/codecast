import React from 'react';
import {SkulptAnalysis, SkulptScope, SkulptVariable} from "../../python/analysis/analysis";
import {AnalysisSnapshot} from "../../analysis";

/**
 * Gets the scope's loaded references from a variable name.
 *
 * @param {object} analysis The analysis.
 * @param {string} name     The variable name.
 *
 * @return {object|null}
 */
export const getLoadedReferencesFromVariable = function(analysis: AnalysisSnapshot, name: string): SkulptVariable {
    // Check in the last (the current) and the first (which is the global) scopes.

    const nbScopes = analysis.stackFrames.length;
    if (getVariableInScope(analysis.stackFrames[nbScopes - 1], name)) {
        return analysis.stackFrames[nbScopes - 1].loadedReferences;
    }
    if (nbScopes > 1 && getVariableInScope(analysis.stackFrames[0], name)) {
        return analysis.stackFrames[0].loadedReferences;
    }

    // @ts-ignore
    return {};
};

/**
 * Gets a variable by name in analysis.
 *
 * @param {object} analysis The analysis.
 * @param {string} name     The name.
 *
 * @return {object|null}
 */
export const getVariable = function(analysis: AnalysisSnapshot, name: string): SkulptVariable {
    // Check in the last (the current) and the first (which is the global) scopes.

    const nbScopes = analysis.functionCallStack.length;
    let variable = null;
    if (nbScopes) {
        variable = getVariableInScope(analysis.functionCallStack[nbScopes - 1], name);
    }
    if (!variable && nbScopes > 1) {
        variable = getVariableInScope(analysis.functionCallStack[0], name);
    }

    return variable;
};

/**
 * Gets variables by name in analysis.
 *
 * @param {object} analysis The analysis.
 * @param {Array}  names    The names.
 *
 * @return {object|null}
 */
export const getVariables = function(analysis: SkulptAnalysis, names: string[]): {name: string, value: SkulptVariable}[] {
    return names.map((name) => {
        return {
            name,
            value: getVariable(analysis, name)
        }
    });
};

/**
 * Gets a variable by name in a scope.
 *
 * @param {object} scope The scope.
 * @param {string} name  The name.
 *
 * @return {object|null}
 */
const getVariableInScope = function(scope: SkulptScope, name: string): SkulptVariable {
    if (scope.variables.hasOwnProperty(name)) {
        return scope.variables[name];
    }

    return null;
};

export const renderValue = function(value) {
    if (value === undefined) {
        return 'noval';
    }
    if (value === null) {
        return 'null';
    }

    return value.toString();
};

const computeArrowPoints = function(p, headSize, tailSize) {
    const dx1 = headSize;
    const dy1 = headSize;
    const dx2 = headSize / 5;
    const dy2 = tailSize;
    return [p(0, 0), p(-dx1, dy1), p(-dx2, dy1), p(-dx2, dy2), p(dx2, dy2), p(dx2, dy1), p(dx1, dy1), p(0, 0)].join(' ');
};

const arrowDirFunc = {
    up: (dx, dy) => `${+dx},${+dy}`,
    down: (dx, dy) => `${+dx},${-dy}`,
    left: (dx, dy) => `${+dy},${+dx}`,
    right: (dx, dy) => `${-dy},${+dx}`
};
export const renderArrow = function(x: number, y: number, dir: 'right' | 'down' | 'up' | 'left', headSize: number, tailSize: number, style?: {}) {
    const ps = computeArrowPoints(arrowDirFunc[dir], headSize, tailSize);

    return <polygon points={ps} transform={`translate(${x},${y})`} {...style} />;
};

export const highlightColors = [
    {fg: '#2196F3', bg: '#BBDEFB', name: 'blue'},
    {fg: '#4CAF50', bg: '#C8E6C9', name: 'green'},
    {fg: '#F44336', bg: '#FFCDD2', name: 'red'},
    {fg: '#00BCD4', bg: '#B2EBF2', name: 'cyan'},
    {fg: '#FFEB3B', bg: '#FFF9C4', name: 'yellow'},
    {fg: '#9C27B0', bg: '#E1BEE7', name: 'purple'},
    {fg: '#FF9800', bg: '#FFE0B2', name: 'orange'},
    {fg: '#9E9E9E', bg: '#F5F5F5', name: 'grey'},
    {fg: '#03A9F4', bg: '#B3E5FC', name: 'light blue'},
    {fg: '#8BC34A', bg: '#DCEDC8', name: 'light green'},
    {fg: '#E91E63', bg: '#F8BBD0', name: 'pink'},
    {fg: '#009688', bg: '#B2DFDB', name: 'teal'},
    {fg: '#FFC107', bg: '#FFECB3', name: 'amber'},
    {fg: '#673AB7', bg: '#D1C4E9', name: 'deep purple'},
    {fg: '#FF5722', bg: '#FFCCBC', name: 'deep orange'},
    {fg: '#607D8B', bg: '#CFD8DC', name: 'blue grey'},
    {fg: '#795548', bg: '#D7CCC8', name: 'brown'},
    {fg: '#CDDC39', bg: '#F0F4C3', name: 'lime'},
    {fg: '#3F51B5', bg: '#C5CAE9', name: 'indigo'}
];

export const noColor = {fg: '#777777', bg: '#F0F0F0', name: 'light gray'};
