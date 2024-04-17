import React from 'react';
import {
    CodecastAnalysisStackFrame,
    CodecastAnalysisVariable, convertVariableDAPToCodecastFormat
} from "../analysis";
import {LayoutDirectiveContext} from '../../../task/layout/LayoutDirective';
import {evalExpr, readValue, stringifyExpr} from '../../views/c/utils';
import {convertUnixValueToDAPVariable} from '../../c/analysis';
import * as C from '@france-ioi/persistent-c';
import {getMessage} from '../../../lang';
import {getOpsArray1D} from '../../views/c/array_utils';

export type DirectiveVariableName = string|[string, string];

export const getVariable = function (context: LayoutDirectiveContext, name: DirectiveVariableName, elemCount?: number): CodecastAnalysisVariable {
    // Check in the last (the current) and the first (which is the global) scopes.

    const variableName = Array.isArray(name) ? name[1] : name;
    const analysis = context.analysis;
    const nbScopes = analysis.stackFrames.length;
    let variable: CodecastAnalysisVariable = null;
    if (nbScopes) {
        variable = getVariableInScope(analysis.stackFrames[nbScopes - 1], variableName);
    }
    if (!variable && nbScopes > 1) {
        variable = getVariableInScope(analysis.stackFrames[0], variableName);
    }

    if (variable && undefined !== elemCount) {
        const programState = context.programState;
        const unixVariable = variable.unixVariable;
        const localMap = new Map([[variableName, unixVariable]]);
        const refExpr = name;
        const cursorValue = evalExpr(programState, localMap, refExpr, false);
        console.log('get var', {name, variable, unixVariable, analysis: analysis.stackFrames, nbScopes, elemCount, cursorValue})

        const {type, ref} = unixVariable;
        // const limits = {scalars: 0, maxScalars: 15};
        // const value =  readValue(context, C.pointerType(type), ref.address, limits);

        if (ref.type.kind !== 'pointer') {
            throw getMessage('ARRAY1D_EXPR_NOPTR').format({expr: stringifyExpr(refExpr)});
        }
        if (elemCount === undefined) {
            if ('orig' in ref.type) {
                // The array size can be obtained from the original type.
                elemCount = ref.type.orig.count.toInteger();
            } else {
                throw getMessage('ARRAY1D_DIM_UNK').format({expr: stringifyExpr(refExpr)});
            }
        }
        const address = ref.address;
        const elemType = ref.type.pointee;
        if (!/^(builtin|pointer|array)$/.test(elemType.kind)) {
            throw getMessage('ARRAY1D_ELT_UNSUP').format({expr: stringifyExpr(refExpr)});
        }
        const cellOpsMap = getOpsArray1D(programState, address, elemCount, elemType.size);

        const typeDecl = '';
        // const typeDecl = renderDeclType(type, '', 0);

        // const convertedVariable = convertUnixValueToDAPVariable(variableName, typeDecl, value, ref.address, {});
        console.log('converted variable', cellOpsMap);

        // return convertedVariable;

    }

    return variable;
};

export const getVariables = function (context: LayoutDirectiveContext, names: DirectiveVariableName[]): {name: DirectiveVariableName, value: CodecastAnalysisVariable}[] {
    return names.map((name) => {
        return {
            name,
            value: getVariable(context, name)
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

