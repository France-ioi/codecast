import React from "react";
import {getStorageFormat} from './smart_contract_utils';
import {useAppSelector} from '../../../hooks';

export function SmartContractStorage() {
    const task = useAppSelector(state => state.task.currentTask);

    if (!task?.gridInfos?.expectedStorage) {
        return null;
    }

    const storageVariables = getStorageFormat(task.gridInfos.expectedStorage);
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
                    <li key={name}><code>{name}</code> should be a {type}{task.gridInfos.taskStrings?.storageDescription[name] ? ': ' + task.gridInfos.taskStrings?.storageDescription[name] : ''}</li>
                )}
            </ul>
        </div>
    );
}
