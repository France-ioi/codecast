/*
This module contains React components that can be used to display values
extracted from the stepper by the analysis module.
*/

import React from 'react';
import * as C from '@france-ioi/persistent-c';

import {getMessage, LocalizedError} from '../../../lang';
import {C_directiveViewDict} from "../index";
import {Block, BlockType} from '../../../task/blocks/block_types';
import {Document, TextDocument} from '../../../buffers/buffer_types';
import {QuickAlgoLibrary} from '../../../task/libs/quickalgo_library';
import {AppStore} from '../../../store';
import {getAvailableModules} from '../../../task/utils';
import {documentToString} from '../../../buffers/document';

interface ViewElement {
    kind: any,
    ref: any,
    current: any,
    load?: any,
    store?: any,
    previous?: any
}

export const readScalarBasic = function(programState, refType, address): ViewElement {
    // Produce a 'basic stored scalar value' object whose shape is
    //   {kind, ref, current}
    // where:
    //   - 'kind' is always 'scalar'
    //   - 'ref' holds the value's reference (a pointer value)
    //   - 'current' holds the current value
    const kind = 'scalar';
    const ref = new C.PointerValue(refType, address);
    const current = C.readValue(programState, ref);
    return {kind, ref, current};
};

export const readScalar = function(context, refType, address) {
    // Produce a 'stored scalar value' object whose shape is
    //   {kind, ref, current, previous, load, store}
    // where:
    //   - 'kind', 'ref', 'current' are as returned by readScalarBasic
    //   - 'load' holds the smallest rank of a load in the memory log
    //   - 'store' holds the greatest rank of a store in the memory log
    //   - 'previous' holds the previous value (if 'store' is defined)
    const {programState, lastProgramState} = context;
    const result = readScalarBasic(programState, refType, address);
    programState.memoryLog.forEach(function(entry, i) {
        /* FIXME: when ref is a pointer type, the length of the value written
                  to it should be used to decide if the ranges intersect */
        if (refsIntersect(result.ref, entry[1])) {
            if (entry[0] === 'load') {
                if (result.load === undefined) {
                    result.load = i;
                }
            } else if (entry[0] === 'store') {
                result.store = i;
            }
        }
    });
    if ('store' in result) {
        result.previous = C.readValue(lastProgramState, result.ref);
    }
    return result;
};

export const readValue = function(context, refType, address, limits) {
    const type = refType.pointee;
    if (type.kind === 'array') {
        if (type.count === undefined) {
            /* Array of unknown size, display as pointer */
            return {kind: 'scalar', current: new C.PointerValue(refType, address)};
        } else {
            const cells = readArray(context, type, address, limits);
            return {kind: 'array', count: type.count, cells};
        }
    }
    if (type.kind === 'record') {
        const fields = readRecord(context, type, address, limits);
        return {kind: 'record', name: type.name, fields};
    }
    if (limits) {
        limits.scalars += 1;
    }
    return readScalar(context, refType, address);
};

export const readArray = function(context, arrayType, address, limits) {
    const elemCount = arrayType.count.toInteger();
    const elemType = arrayType.elem;
    const elemSize = elemType.size;
    const elemRefType = C.pointerType(elemType);
    const cells = [];
    let index;
    for (index = 0; index < elemCount; index += 1) {
        const content = readValue(context, elemRefType, address, context);
        cells.push({index, address, content});
        address += elemSize;
        if (limits && limits.scalars >= limits.maxScalars) {
            break;
        }
    }
    if (index < elemCount) {
        index += 1;
        cells.push({index, address, content: {kind: 'ellipsis'}});
    }
    return cells;
};

export const readRecord = function(context, recordType, address, limits) {
    const fields = [];
    for (let fieldName of recordType.fields) {
        const {offset, type} = recordType.fieldMap[fieldName];
        const fieldAddress = address + offset;
        const content = readValue(context, C.pointerType(type), fieldAddress, limits);
        fields.push({name: fieldName, address: fieldAddress, content});
        if (limits && limits.scalars >= limits.maxScalars) {
            break;
        }
    }
    if (fields.length < recordType.fields.length) {
        fields.push({ellipsis: true});
    }
    return fields;
};


export const refsIntersect = function(ref1, ref2) {
    const base1 = ref1.address, limit1 = base1 + ref1.type.pointee.size - 1;
    const base2 = ref2.address, limit2 = base2 + ref2.type.pointee.size - 1;
    const result = (base1 <= base2) ? (base2 <= limit1) : (base1 <= limit2);
    return result;
};

/**
 Evaluator for expressions found in directives.
 If asRef is false, the (scalar) value of expr (in the given context) is
 returned.
 If asRef is true, expr is interpreted as an l-value and its address
 is returned.
 If any error occurs, an Error is thrown.
 */
export const evalExpr = function(programState, localMap, expr, asRef?) {
    if (expr[0] === 'ident') {
        const name = expr[1];
        const decl = localMap.get(name);
        if (!decl) {
            if (name in programState.globalMap) {
                const value = programState.globalMap[name];
                if (value instanceof C.PointerValue) {
                    return evalRef(programState, value, asRef);
                }
            }

            throw new LocalizedError('EVAL_REF_UNDEF_VAR', {name});
        }

        return evalRef(programState, decl.ref, asRef);
    }
    if (expr[0] === 'deref') {
        const ref = evalExpr(programState, localMap, expr[1], false);
        if (ref.type.kind !== 'pointer') {
            throw new LocalizedError('EVAL_DEREF_NONPTR', []);
        }

        return evalRef(programState, ref, asRef);
    }
    if (expr[0] === 'subscript') {
        const arrayRef = evalExpr(programState, localMap, expr[1], false);
        if (arrayRef.type.kind !== 'pointer') {
            throw new LocalizedError('EVAL_SUBSC_NONPTR', []);
        }

        const index = evalExpr(programState, localMap, expr[2], false);
        if (index.type.kind !== 'builtin') {
            throw new LocalizedError('EVAL_SUBSC_NONBLT', []);
        }

        const elemType = arrayRef.type.pointee;
        const address = arrayRef.address + elemType.size * index.toInteger();
        const ref = C.makeRef(elemType, address);
        if (asRef || elemType.kind === 'array') {
            return ref;
        } else {
            return C.readValue(programState, ref);
        }
    }
    if (asRef) {
        throw new LocalizedError('EVAL_ADDR_NONLVAL', []);
    }
    if (expr[0] === 'number') {
        return new C.IntegralValue(C.builtinTypes['int'], expr[1] | 0);
    }
    if (expr[0] === 'addrOf') {
        return evalExpr(programState, localMap, expr[1], true);
    }

    throw new LocalizedError('EVAL_UNSUP_EXPR', []);
};

export const evalRef = function(programState, ref, asRef) {
    if (asRef) {
        if (ref.type.pointee.kind === 'array') {
            // Taking the address of an array, returns a decayed pointer to the array.
            // Perhaps this should be already be done in persistent-c?
            return C.makeRef(ref.type.pointee, ref.address);
        }
        return ref;
    } else {
        const valueType = ref.type.pointee;
        if (valueType.kind === 'array') {
            return C.makeRef(valueType, ref.address);
        } else {
            return C.readValue(programState, ref);
        }
    }
};

const strParensIf = function(cond, str) {
    return cond ? `(${str})` : str;
};

export const stringifyExpr = function(expr, precedence?) {
    precedence = precedence || 0;
    if (expr[0] === 'parens') {
        return strParensIf(true, stringifyExpr(expr[1], 0));
    }
    if (expr[0] === 'ident' || expr[0] === 'number') {
        return expr[1].toString();
    }
    if (expr[0] === 'deref') {
        return strParensIf(precedence > 1, `*${stringifyExpr(expr[1], 1)}`);
    }
    if (expr[0] === 'subscript') {
        return strParensIf(
            precedence > 2,
            `${stringifyExpr(expr[1], 2)}[${stringifyExpr(expr[2], 0)}]`);
    }
    if (expr[0] === 'addrOf') {
        return `&${stringifyExpr(expr[1], 0)}`;
    }
    return JSON.stringify(expr);
};

export const viewExprs = function(programState, stackFrame, exprs) {
    const localMap = stackFrame.get('localMap');
    const views = [];
    exprs.forEach(function(expr) {
        const label = stringifyExpr(expr, 0);
        try {
            const value = evalExpr(programState, localMap, expr, false);
            views.push({label, value});
        } catch (ex) {
            views.push({label, error: ex.toString});
        }
    });
    return views;
};

export const renderValue = function(value) {
    if (value === undefined) {
        return 'noval';
    }
    if (value === null) {
        return 'void';
    }
    return value.toString();
};

export const getNumber = function(expr, options) {
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
        const decl = stackFrame.get('localMap').get(expr[1]);
        if (decl && decl.type.kind === 'builtin') {
            const value = C.readValue(programState, decl.ref);
            if (value) {
                return value.toInteger();
            }
        }
    }
    return noVal;
};

export const getList = function(expr, noVal) {
    if (!expr) {
        return noVal;
    }
    return expr[0] === 'list' ? expr[1] : noVal;
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
export const renderArrow = function(x, y, dir, headSize, tailSize, style?) {
    const ps = computeArrowPoints(arrowDirFunc[dir], headSize, tailSize);

    return <polygon points={ps} transform={`translate(${x},${y})`} {...style} />;
};

export function getCSpecificBlocks(): Block[] {
    const availableBlocks: Block[] = [];

    for (let [directive, directiveData] of Object.entries(C_directiveViewDict)) {
        if (!directiveData.snippet) {
            continue;
        }
        availableBlocks.push({
            name: directive,
            type: BlockType.Directive,
            caption: directive,
            code: directiveData.snippet,
        });
    }

    return availableBlocks;
}

export const checkCCode = function (document: Document, context: QuickAlgoLibrary, state: AppStore, disabledValidations: string[] = []) {
    const code = documentToString(document as unknown as TextDocument);

    const availableModules = getAvailableModules(context);
    for (let availableModule of availableModules) {
        if ('printer' === availableModule) {
            // Printer lib is optional
            continue;
        }
        let match = (new RegExp('\#include <' + availableModule + '\.h>')).exec(code);
        if (null === match) {
            throw getMessage('PROGRAM_MISSING_LIB').format({line: `<code>#include &lt;${availableModule}.h&gt;</code>`});
        }
    }
}
