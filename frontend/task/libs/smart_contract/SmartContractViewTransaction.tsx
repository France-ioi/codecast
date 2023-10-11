import React, {useState} from "react";
import {SmartContractResultLogLine} from './smart_contract_lib';
import {DateTime} from 'luxon';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowRight} from '@fortawesome/free-solid-svg-icons/faArrowRight';
import {capitalizeFirstLetter, nl2br} from '../../../common/utils';
import {toHtml} from '../../../utils/sanitize';
import {convertMichelsonStorageToCodecastFormat} from './smart_contract_utils';
import {useAppSelector} from '../../../hooks';
import { AnalysisVariable } from '../../../stepper/analysis/AnalysisVariable';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {Icon} from '@blueprintjs/core';

interface SmartContractViewTransactionProps {
    log: SmartContractResultLogLine,
    names: { [key: string]: string }
}

export function SmartContractViewTransaction(props: SmartContractViewTransactionProps) {
    const task = useAppSelector(state => state.task.currentTask);

    const truncateString = (string: string, maxLength: number) => {
        return string && string.length > maxLength ? string.substring(0, maxLength) + '...' : string;
    };

    const log = props.log;
    const addressNames = props.names;
    const hasMultipleContracts = props.names['_hasMultipleContracts'];
    const hasExpansion = undefined !== log.consumed_gas || undefined !== log.paid_storage_size_diff;
    const transactionStorage = undefined !== log.updated_storage ? log.updated_storage : log.storage;
    const expectedStorage = undefined !== log.expected?.updated_storage ? log.expected?.updated_storage : log.expected?.storage;
    const wrongExpectedStorage = log.isFailed && undefined !== expectedStorage && transactionStorage !== expectedStorage;
    const failMessage = log.fail ? log.fail : (log.stderr ? log.stderr.split("\n")[0] : null);

    const getDisplayedStorage = (storage) => {
        if (!task.gridInfos.expectedStorage) {
            return storage;
        }

        const storageVariables = convertMichelsonStorageToCodecastFormat(storage, task.gridInfos.expectedStorage);

        return <div className="scope-function-blocks">
            <ul className='global-scope'>
                {storageVariables.map((variable, variableIndex) =>
                    <li key={variableIndex}>
                        <AnalysisVariable
                            variable={variable}
                            stackFrameId={0}
                        />
                    </li>
                )}
            </ul>
        </div>;
    }

    const displayKind = (log: SmartContractResultLogLine) => {
        if (log.name && log.address) {
            return <span>{capitalizeFirstLetter(log.kind || "Transaction")}: {addressNames[log.address]} ({truncateString(log.address, 10)})</span>;
        } else if (!log.kind && log.source && log.destination && log.amount) {
            return <span>Transfer of {log.amount} tez to {displayAddress(log.destination)}</span>;
        } else {
            return <span>{capitalizeFirstLetter(log.kind || "Transaction")}</span>;
        }
    }

    const displayAddress = (address: string, displayAddress: boolean = true) => {
        if (addressNames[address]) {
            if (displayAddress) {
                return <span>{addressNames[address]} ({truncateString(address, 10)})</span>;
            } else {
                return <span>{addressNames[address]}</span>;
            }
        }
        return <span>{truncateString(address, 10)}</span>;
    }

    return (
        <div className={`smart-contract-log ${log.isFailed ? 'is-failed' : ''} ${log.internal ? 'is-internal' : ''}`}>
            <div className="smart-contract-log__header">
                <div className="smart-contract-log__icon">
                    <FontAwesomeIcon icon={log.isFailed ? faTimes : faCheck} />
                </div>
                {undefined !== log.entrypoint ? <div className="smart-contract-log__entry_point">
                    <span>{hasMultipleContracts && log.destination && displayAddress(log.destination, false)}.{log.entrypoint}({log.arg})</span>
                </div> :
                    <div className="smart-contract-log__kind">{displayKind(log)}</div>
                }
                {/* <div className="smart-contract-log__date">{DateTime.fromISO(log.date).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}</div> */}
            </div>
            <div className="smart-contract-log__body">
                <div className="smart-contract-log__scalars">
                    <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Caller</div>
                        <div className="smart-contract-scalar__value">{displayAddress(log.source)}</div>
                    </div>
                    <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Amount</div>
                        <div className="smart-contract-scalar__value">{log.amount} tez</div>
                    </div>
                    {/*<div className="smart-contract-scalar">*/}
                    {/*    <div className="smart-contract-scalar__header">Balance</div>*/}
                    {/*    <div className="smart-contract-scalar__value">{log.balance} tez</div>*/}
                    {undefined !== log.level && <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Level</div>
                        <div className="smart-contract-scalar__value">{log.level}</div>
                    </div>}
                    {undefined !== log.now && <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Now</div>
                        <div className="smart-contract-scalar__value">{DateTime.fromISO(log.now).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}</div>
                    </div>}
                </div>

                {undefined !== log.arg && <div className="smart-contract-scalar mt-2">
                    <div className="smart-contract-scalar__header">Parameter</div>
                    <div className="smart-contract-scalar__value">{log.arg}</div>
                </div>}


                {undefined !== transactionStorage && <div className={`smart-contract-log__storage smart-contract-scalar ${wrongExpectedStorage ? 'is-wrong' : ''}`}>
                    <div className="smart-contract-scalar__header">
                        {wrongExpectedStorage && <FontAwesomeIcon icon={faTimes} className="mr-1"/>}
                        {undefined !== log.updated_storage ? 'Updated storage' : 'Storage'}
                        {undefined !== log.storage_size ? ` (${log.storage_size} bits)` : ''}
                    </div>
                    <div className="smart-contract-scalar__value">
                        {getDisplayedStorage(transactionStorage)}
                    </div>
                </div>}

                {wrongExpectedStorage && <div>
                    <div className="smart-contract-error mt-2">
                        <strong>Error, wrong storage. Expected storage was:</strong>

                        <div className="smart-contract-log__storage smart-contract-scalar">
                            <div className="smart-contract-scalar__value">
                                <div>{getDisplayedStorage(expectedStorage)}</div>
                            </div>
                        </div>
                    </div>
                </div>}

                {hasExpansion && <div className="smart-contract-log__scalars smart-contract-log__costs">
                    {undefined !== log.consumed_gas && <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Consumed gas</div>
                        <div className="smart-contract-scalar__value">{log.consumed_gas}</div>
                    </div>}
                    {undefined !== log.paid_storage_size_diff && <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Paid storage size diff</div>
                        <div className="smart-contract-scalar__value">{log.paid_storage_size_diff}</div>
                    </div>}
                </div>}
            </div>
            {log.failed && <div className={`smart-contract-log__footer ${log.isFailed ? 'is-failed' : ''}`}>
                <div>
                    {log.isFailed ?
                        <div>Failed{failMessage ? `, with error: ${failMessage}` : ''}</div>
                        :
                        (log.fail ? <div>Failed as expected, with error: {log.fail}</div> : <div>Failed as expected</div>)
                    }
                </div>
            </div>}
        </div>
    );
}
