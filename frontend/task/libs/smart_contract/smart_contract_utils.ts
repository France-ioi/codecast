import {Expr, Parser, Prim} from '@taquito/michel-codec';
import {CodecastAnalysisVariable} from '../../../stepper/analysis/analysis';

export function convertMichelsonStorageToCodecastFormat(actualStorage: string, storageType?: string): CodecastAnalysisVariable[] {
    if (null === actualStorage || undefined === actualStorage) {
        return [];
    }

    const p = new Parser();

    const actualStorageParsed = p.parseMichelineExpression(actualStorage);
    const storageTypeParsed = p.parseMichelineExpression(storageType) as Prim;

    const storageData = [];
    matchMichelsonStorageToObject(actualStorageParsed, storageTypeParsed, storageData);

    return storageData;
}

export interface SmartContractStorageElement {
    name: string,
    type: string,
}

export function getStorageFormat(storageType: string) {
    const p = new Parser();

    const storageFormat = p.parseMichelineExpression(storageType) as Prim;

    const storageData: SmartContractStorageElement[] = [];

    walkStorageTypeAndExtractVariables(storageFormat, storageData);

    return storageData;
}

function isPrim(object: Expr): object is Prim {
    return 'prim' in object;
}

function matchMichelsonStorageToObject(actualStorage: Expr, storageType: Prim, storageData: CodecastAnalysisVariable[]) {
    if (storageType.args?.length) {
        for (let argIndex = 0; argIndex < storageType.args.length; argIndex++) {
            const storageTypeArg = storageType.args[argIndex];
            if (isPrim(actualStorage) && isPrim(storageTypeArg)) {
                let value = matchMichelsonStorageToObject(actualStorage.args[argIndex], storageTypeArg, storageData);
                addNewVariableToStorageData(storageTypeArg, value, storageData);
            }
        }
    }

    if ('Pair' !== storageType.prim) {
        const value = Object.values(actualStorage)[0];
        addNewVariableToStorageData(storageType, value, storageData);
    }

    return null;
}

function addNewVariableToStorageData(storageTypeArg: Prim, value: any, storageData: CodecastAnalysisVariable[]) {
    if (storageTypeArg.annots && storageTypeArg.annots.length) {
        const name = storageTypeArg.annots[0].substring(1);
        if ('string' === storageTypeArg.prim) {
            value = `"${value}"`;
        } else if ('mutez' === storageTypeArg.prim) {
            value = Math.round((value / 1000000) * 100) / 100;
        }

        storageData.push({
            name,
            type: storageTypeArg.prim,
            displayType: -1 !== ['int', 'nat', 'mutez'].indexOf(storageTypeArg.prim),
            value,
            path: name,
            previousValue: null,
            variables: null,
            variablesReference: storageData.length,
        });
    }
}

function walkStorageTypeAndExtractVariables(storageType: Prim, storageData: SmartContractStorageElement[]) {
    if (storageType.annots?.length) {
        const name = storageType.annots[0].substring(1);
        storageData.push({
            name,
            type: storageType.prim,
        });
    }

    if (storageType.args?.length) {
        for (let argIndex = 0; argIndex < storageType.args.length; argIndex++) {
            const storageTypeArg = storageType.args[argIndex];
            if (isPrim(storageTypeArg)) {
                walkStorageTypeAndExtractVariables(storageTypeArg, storageData);
            }
        }
    }

    return storageData;
}

