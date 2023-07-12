import React from "react";
import {AppStore} from "../../../store";
import {useAppSelector} from "../../../hooks";
import {SmartContractResultLogLine} from './smart_contract_lib';
import {SmartContractViewTransaction} from './SmartContractViewTransaction';
import {Alert} from "react-bootstrap";
import {getMessage} from '../../../lang';

export function SmartContractView() {
    const taskState = useAppSelector((state: AppStore) => state.task.state);
    if (!taskState || !taskState.resultLog) {
        return (
            <div className="smart-contract-visualization is-empty">
                {getMessage('TASK_VISUALIZATION_EMPTY')}
            </div>
        );
    }

    const resultLog: SmartContractResultLogLine[] = taskState.resultLog;

    const hasFailed = !taskState.success;

    return (
        <div className="smart-contract-visualization">
            {resultLog.map((log, logIndex) =>
                <SmartContractViewTransaction
                    key={logIndex}
                    log={log}
                    failed={logIndex === resultLog.length - 1 && !taskState.success}
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
