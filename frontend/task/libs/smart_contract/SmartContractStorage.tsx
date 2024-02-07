import React from "react";
import {getStorageFormat} from './smart_contract_utils';
import {useAppSelector} from '../../../hooks';

export function SmartContractStorage() {
    const levelGridInfos = useAppSelector(state => state.task.levelGridInfos);

    if (!levelGridInfos?.expectedStorage) {
        return null;
    }

    const storageVariables = getStorageFormat(levelGridInfos.expectedStorage);
    if (!storageVariables.length) {
        return null;
    }

    return (
        <div className="smart-contract-storage">
            <p>
                Your contract should have exactly {storageVariables.length} value{storageVariables.length > 1 ? 's' : ''} in
                the storage{storageVariables.length > 1 ? ', in this order' : ''}:
            </p>
            <ul>
                {storageVariables.map(({name, type}) =>
                    <li key={name}><code>{name}</code> should be a {type}{levelGridInfos.taskStrings?.storageDescription[name] ? ': ' + levelGridInfos.taskStrings?.storageDescription[name] : ''}</li>
                )}
            </ul>
        </div>
    );
}
