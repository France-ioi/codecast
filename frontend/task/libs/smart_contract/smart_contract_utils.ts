import {Expr, Parser, Prim} from '@taquito/michel-codec';
import {CodecastAnalysisVariable} from '../../../stepper/analysis/analysis';

export function convertMichelsonStorageToCodecastFormat(actualStorage: string, storageType?: string): CodecastAnalysisVariable[] {
    if (!actualStorage) {
        return [];
    }

    const p = new Parser();

    const actualStorageParsed = p.parseMichelineExpression(actualStorage);
    const storageTypeParsed = p.parseMichelineExpression(storageType) as Prim;

    const storageData = [];
    matchMichelsonStorageToObject(actualStorageParsed, storageTypeParsed, storageData);

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
        }
    }

    if ('Pair' !== storageType.prim) {
        return Object.values(actualStorage)[0];
    }

    return null;
}
