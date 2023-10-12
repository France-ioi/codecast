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

    const hasFailed = !taskState.success;

    const isContract = (address: string): boolean => address && !address.startsWith('tz1');

    const processLog = (resultLog: SmartContractResultLogLine[]): SmartContractResultLogLine[] => {
        let processedLog: SmartContractResultLogLine[] = [];
        resultLog.forEach((log, logIdx) => {
            const failedLog = hasFailed && logIdx === resultLog.length - 1;
            processedLog.push({ isFailed: failedLog, ...log });
            log.internal_operations?.forEach((internalLog, internalLogIdx) => {
                processedLog.push({
                    arg: internalLog.parameter,
                    level: log.level,
                    now: log.now,
                    expected: log.expected?.internal_operations?.[internalLogIdx],
                    isFailed: failedLog,
                    ...internalLog,
                    internal: true
                });
            });
        });
        let balances = {};
        processedLog.forEach((log) => {
            if (log.amount) {
                if ('origination' == log.kind) {
                    balances[log.address] = Number(log.amount);
                }
                if (isContract(log.source) && undefined !== balances[log.source]) {
                    log.balance_source = balances[log.source] -= Number(log.amount);
                }
                if (isContract(log.destination) && undefined !== balances[log.destination]) {
                    log.balance_destination = balances[log.destination] += Number(log.amount);
                }
            }
        });
        return processedLog;
    };

    const resultLog: SmartContractResultLogLine[] = processLog(taskState.resultLog);

    const getAddressNames = (resultLog: SmartContractResultLogLine[]) => {
        let aNames = {}; // maps addresses to names
        let cNames = {}; // counts how many times a name is used
        let fcNames = {}; // maps names to first address using it (to rename it to #1)
        const getNewName = (name: string, address: string) => {
            if (aNames[address]) {
                return aNames[address];
            }
            if (cNames[name]) {
                aNames[fcNames[name]] = name + " #1";
                return name + " #" + (++cNames[name]);
            }
            cNames[name] = 1;
            fcNames[name] = address;
            return name;
        }

        resultLog.forEach((log) => {
            if (log.name && log.address) {
                aNames[log.address] = getNewName(log.name, log.address);
            }
            if (log.as && log.source) {
                aNames[log.source] = getNewName(log.as, log.source);
            }
        });
        aNames['_hasMultipleContracts'] = Object.keys(aNames).filter(isContract).length > 1;
        return aNames;
    };
    const addressNames = getAddressNames(resultLog);

    return (
        <div className="smart-contract-visualization">
            {resultLog.map((log, logIndex) =>
                <SmartContractViewTransaction
                    key={logIndex}
                    log={log}
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
