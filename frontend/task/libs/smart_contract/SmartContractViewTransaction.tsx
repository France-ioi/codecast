import React, {useState} from "react";
import {SmartContractResultLogLine} from './smart_contract_lib';
import {DateTime} from 'luxon';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
import {faArrowRight} from '@fortawesome/free-solid-svg-icons/faArrowRight';
import {capitalizeFirstLetter, nl2br} from '../../../common/utils';
import {toHtml} from '../../../utils/sanitize';

interface SmartContractViewTransactionProps {
    log: SmartContractResultLogLine
}

export function SmartContractViewTransaction(props: SmartContractViewTransactionProps) {
    const truncateString = (string: string, maxLength: number) => {
        return string && string.length > maxLength ? string.substring(0, maxLength) + '...' : string;
    };

    const log = props.log;
    const [expanded, setExpanded] = useState(false);
    const needsExpansion = undefined !== log.consumed_gas || undefined !== log.paid_storage_size_diff;

    const seeMore = () => {
        setExpanded(true);
    };

    return (
        <div className="smart-contract-log">
            <div className="smart-contract-log__header">
                <div className="smart-contract-log__date">{DateTime.fromISO(log.date).toLocaleString(DateTime.DATETIME_SHORT)}</div>
                <div className="smart-contract-log__kind">{capitalizeFirstLetter(log.kind)}</div>
                <div className="smart-contract-log__hash">{log.operation}</div>
            </div>
            <div className="smart-contract-log__body">
                <div className="smart-contract-log__scalars">
                    <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Source</div>
                        <div className="smart-contract-scalar__value">{log.as} ({truncateString(log.source, 10)})</div>
                    </div>
                    <div className="smart-contract-scalar">
                        <div className="smart-contract-scalar__header">Amount</div>
                        <div className="smart-contract-scalar__value">{log.amount}</div>
                    </div>
                </div>

                {undefined !== log.entrypoint && <div className="smart-contract-log__entry_point">
                    <FontAwesomeIcon icon={faArrowRight} className="mr-2"/>
                    <span>{log.entrypoint}({log.arg})</span>
                </div>}

                {undefined !== log.storage && <div className="smart-contract-log__storage smart-contract-scalar">
                    <div className="smart-contract-scalar__header">Storage {undefined !== log.storage_size ? `(${log.storage_size} bits)` : ''}</div>
                    <div className="smart-contract-scalar__value">{log.storage}</div>
                </div>}

                {undefined !== log.updated_storage && <div className="smart-contract-log__storage smart-contract-scalar">
                    <div className="smart-contract-scalar__header">Updated storage {undefined !== log.storage_size ? `(${log.storage_size} bits)` : ''}</div>
                    <div className="smart-contract-scalar__value">{log.updated_storage}</div>
                </div>}

                {!expanded && needsExpansion && <p className="smart-contract-log__see-more mt-2">
                    <a onClick={seeMore}>
                        <FontAwesomeIcon icon={faChevronDown} className="mr-1"/>
                        <span>Voir plus</span>
                    </a>
                </p>}

                {expanded && <div className="smart-contract-log__scalars smart-contract-log__costs">
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
            {log.failed && <div className="smart-contract-log__footer">
                <div dangerouslySetInnerHTML={toHtml(nl2br(log.stderr))}/>
            </div>}
        </div>
    );
}
