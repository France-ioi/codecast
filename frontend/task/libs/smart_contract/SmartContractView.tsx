import React from "react";
import {AppStore} from "../../../store";
import {useAppSelector} from "../../../hooks";
import {SmartContractResultLogLine} from './smart_contract_lib';
import {SmartContractViewTransaction} from './SmartContractViewTransaction';
import {Alert} from "react-bootstrap";

export function SmartContractView() {
    const taskState = useAppSelector((state: AppStore) => state.task.state);
    if (!taskState || !taskState.resultLog) {
        return null;
    }

    const resultLog: SmartContractResultLogLine[] = taskState.resultLog;

    const hasFailed = 0 < resultLog.filter(log => log.failed).length;

    return (
        <div className="smart-contract-visualization">
            {resultLog.map((log, logIndex) =>
                <SmartContractViewTransaction
                    key={logIndex}
                    log={log}
                />
            )}

            {!hasFailed && !!taskState.errorMessage && <Alert variant="danger" className="smart-contract-visualization-error">
                {taskState.errorMessage}
            </Alert>}
        </div>
    );
}
