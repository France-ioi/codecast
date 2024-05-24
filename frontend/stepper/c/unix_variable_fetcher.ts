import AbstractVariableFetcher from '../analysis/abstract_variable_fetcher';
import * as C from '@france-ioi/persistent-c';
import {evalExpr, stringifyExpr} from '../views/c/utils';
import {LayoutDirectiveContext} from '../../task/layout/LayoutDirective';
import {DirectiveVariableName} from '../analysis/directives/utils';
import {CodecastAnalysisVariable, convertVariableDAPToCodecastFormat} from '../analysis/analysis';
import {getMessage} from '../../lang';
import {getOpsArray1D, readArray1D} from '../views/c/array_utils';
import {convertUnixValueToDAPVariable} from './analysis';
import range from 'node-range';

export default class UnixVariableFetcher extends AbstractVariableFetcher {
    getNumber(expr, options) {
        let noVal;
        if (typeof options === 'object') {
            noVal = options.noVal;
        } else {
            noVal = options;
            options = {};
        }
        if (!expr) {
            return noVal;
        }
        if (expr[0] === 'number') {
            return expr[1];
        }
        const programState = options.programState;
        const stackFrame = options.stackFrame;
        if (expr[0] === 'ident' && programState && stackFrame) {
            const decl = stackFrame['localMap'][expr[1]];
            if (decl && decl.type.kind === 'builtin') {
                const value = C.readValue(programState, decl.ref);
                if (value) {
                    return value.toInteger();
                }
            }
        }

        return noVal;
    }
    getList(expr, defaultValue) {
        if (!expr) {
            return defaultValue;
        }
        return expr[0] === 'list' ? expr[1] : defaultValue;
    }
    stringifyVariableName(name) {
        return stringifyExpr(name, 0);
    }
    getVariable(context: LayoutDirectiveContext, name: DirectiveVariableName, elemCount?: number): CodecastAnalysisVariable {
        // Check in the last (the current) and the first (which is the global) scopes.

        const variableName = Array.isArray(name) ? name[1] : name;
        const analysis = context.analysis;
        const nbScopes = analysis.stackFrames.length;
        const variable = super.getVariable(context, name, elemCount);

        if (variable && undefined !== elemCount) {
            const programState = context.programState;
            const unixVariable = variable.unixVariable;
            const localMap = {};
            localMap[variableName] = unixVariable;
            const refExpr = name;
            const ref = evalExpr(programState, localMap, refExpr, false);

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

            const selection = range(0, elemCount);
            const cells = readArray1D(context, address, elemType, elemCount, selection, cellOpsMap);

            const unixValue = {
                kind: 'array',
                cells,
            }

            const convertedVariable = convertUnixValueToDAPVariable(variableName, null, unixValue, address, {});

            const previousValues = {};
            for (let [index, cell] of cells.entries()) {
                if (cell.content.previous) {
                    previousValues[`0.0.${variableName}.${index}`] = cell.content.previous;
                }
            }

            return convertVariableDAPToCodecastFormat(0, 0, null, convertedVariable, previousValues, {});
        }

        return variable;
    }
}
