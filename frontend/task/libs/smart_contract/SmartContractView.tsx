import React from "react";
import {AppStore} from "../../../store";
import {useAppSelector} from "../../../hooks";
import {SmartContractResultLogLine} from './smart_contract_lib';
import {DateTime} from 'luxon';

export function SmartContractView() {
    const taskState = useAppSelector((state: AppStore) => state.task.state);
    if (!taskState || !taskState.resultLog) {
        return null;
    }

    const resultLog: SmartContractResultLogLine[] = taskState.resultLog;

    return (
        <div className="smart-contract-visualization">
            {resultLog.map((log, logIndex) =>
                <div className="smart-contract-log" key={logIndex}>
                    <div className="smart-contract-log__header">
                        <div className="smart-contract-log__date">{DateTime.fromISO(log.date).toLocaleString(DateTime.DATETIME_SHORT)}</div>
                        <div className="smart-contract-log__kind">{log.kind}</div>
                        <div className="smart-contract-log__hash">Hash: ?</div>
                    </div>
                    <div className="smart-contract-log__body">
                        <div className="smart-contract-log__scalars">
                            <div className="smart-contract-scalar">
                                <div className="smart-contract-scalar__header">Source</div>
                                <div className="smart-contract-scalar__value">{log.as}</div>
                            </div>
                            <div className="smart-contract-scalar">
                                <div className="smart-contract-scalar__header">Destination</div>
                                <div className="smart-contract-scalar__value"></div>
                            </div>
                            <div className="smart-contract-scalar">
                                <div className="smart-contract-scalar__header">Amount</div>
                                <div className="smart-contract-scalar__value"></div>
                            </div>
                        </div>

                        <div>
                            call
                        </div>

                        <div>
                            Storage
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
