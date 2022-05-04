import React from 'react';
import {
    CodecastAnalysisSnapshot,
    CodecastAnalysisStackFrame,
    CodecastAnalysisVariable
} from "../../analysis";

/**
 * Gets a variable by name in analysis.
 *
 * @param {object} analysis The analysis.
 * @param {string} name     The name.
 *
 * @return {object|null}
 */
export const getVariable = function(analysis: CodecastAnalysisSnapshot, name: string): CodecastAnalysisVariable {
    // Check in the last (the current) and the first (which is the global) scopes.

    console.log('get variable', analysis, name);
    const nbScopes = analysis.stackFrames.length;
    let variable = null;
    if (nbScopes) {
        variable = getVariableInScope(analysis.stackFrames[nbScopes - 1], name);
    }
    if (!variable && nbScopes > 1) {
        variable = getVariableInScope(analysis.stackFrames[0], name);
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
export const getVariables = function(analysis: CodecastAnalysisSnapshot, names: string[]): {name: string, value: CodecastAnalysisVariable}[] {
    return names.map((name) => {
        return {
            name,
            value: getVariable(analysis, name)
        }
    });
};

/**
 * Gets a variable by name in a scope.
 */
const getVariableInScope = function(stackFrame: CodecastAnalysisStackFrame, name: string): CodecastAnalysisVariable {
    let variable = stackFrame.variables.find(variable => name === variable.name);

    return variable ? variable : null;
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

