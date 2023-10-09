import React from "react";
import {AppStore} from "../../../store";
import {useAppSelector} from "../../../hooks";
import {SmartContractResultLogLine} from './smart_contract_lib';
import {SmartContractViewTransaction} from './SmartContractViewTransaction';
import {Alert} from "react-bootstrap";
import {getMessage} from '../../../lang';

export function SmartContractView() {
    const taskState = useAppSelector((state: AppStore) => state.task.state?.smart_contract);
    if (!taskState || !taskState.resultLog) {
        return (
            <div className="smart-contract-visualization is-empty">
                {getMessage('TASK_VISUALIZATION_EMPTY')}
            </div>
        );
    }

    const convertInternalOperationFormat = (internalLog: any): SmartContractResultLogLine => {
        // This conversion might not be needed in the future
        return {
            internal: true,
            source: internalLog.from,
            destination: internalLog.to,
            amount: internalLog.amount.substr(1),
            entrypoint: internalLog.entrypoint,
            consumed_gas: internalLog.consumed_gas,
            updated_storage: internalLog.updated_storage,
            storage_size: internalLog.storage_size,
        }
    }

    const processInternalOperations = (resultLog: SmartContractResultLogLine[]): SmartContractResultLogLine[] => {
        let processedLog = [];
        resultLog.forEach((log) => {
            processedLog.push(log);
            if (log.internal_operations) {
                log.internal_operations.forEach((internalLog) => {
                    processedLog.push(convertInternalOperationFormat(internalLog));
                });
            }
        });
        return processedLog;
    };

    const resultLog: SmartContractResultLogLine[] = processInternalOperations(taskState.resultLog);

    const processAddressNames = (resultLog: SmartContractResultLogLine[]) => {
        let names = {};
        resultLog.forEach((log) => {
            if (log.name && log.address) {
                names[log.address] = log.name;
            }
            if (log.as && log.source) {
                names[log.source] = log.as;
            }
        });
        names['_hasMultipleContracts'] = Object.keys(names).filter((key) => !key.startsWith('tz1')).length > 1;
        return names;
    };
    const addressNames = processAddressNames(resultLog);

    const hasFailed = !taskState.success;

    return (
        <div className="smart-contract-visualization">
            {resultLog.map((log, logIndex) =>
                <SmartContractViewTransaction
                    key={logIndex}
                    log={log}
                    failed={logIndex === resultLog.length - 1 && !taskState.success}
                    names={addressNames}
                />
            )}

            {!hasFailed && !!taskState.errorMessage && <Alert variant="danger" className="smart-contract-visualization-error">
                {taskState.errorMessage}
            </Alert>}

            {!hasFailed && <Alert variant="success" className="smart-contract-visualization-success">
                {getMessage('TASK_LEVEL_SUCCESS_FINISHED')}
            </Alert>}
        </div>
    );
}
