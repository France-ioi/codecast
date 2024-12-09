import React, {useEffect, useRef, useState} from "react";
import {useAppSelector} from "../../hooks";
import {getMessage, getMessageChoices} from "../../lang";
import {AllowExecutionOverBlocksLimit, AppStore} from "../../store";
import {selectActiveBufferPlatform} from '../../buffers/buffer_selectors';
import {Button, Intent} from '@blueprintjs/core';
import {faShoePrints} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

export function BlocksUsage() {
    const blocksUsage = useAppSelector(state => state.task.blocksUsage);
    const allowExecutionOverBlocksLimit = useAppSelector(state => state.options.allowExecutionOverBlocksLimit);
    const platform = useAppSelector(selectActiveBufferPlatform);
    const [collapsed, setCollapsed] = useState(true);

    const toggleCollapsed = () => {
        if (!blocksUsage.error) {
            setCollapsed(!collapsed);
        }
    };

    const wrapperRef = useRef<HTMLDivElement>();

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target) && !collapsed) {
                setCollapsed(true);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, collapsed]);

    if (!blocksUsage || (!blocksUsage.error && (!blocksUsage.blocksLimit || Infinity === blocksUsage.blocksLimit))) {
        return null;
    }

    const limitations = blocksUsage.limitations ? blocksUsage.limitations.map(limitation => {
        return getMessageChoices('TASK_BLOCKS_LIMIT_BLOCK', limitation.limit - limitation.current).format({
            remaining: limitation.limit - limitation.current,
            name: limitation.name,
        });
    }).join(', ') : null;

    const blockLimitError = blocksUsage.error && blocksUsage.blocksCurrent > blocksUsage.blocksLimit;
    const onlyStepByStep = blockLimitError && AllowExecutionOverBlocksLimit.OnlyStepByStep === allowExecutionOverBlocksLimit;

    return (
        <div ref={wrapperRef} className={`blocks-usage ${blocksUsage.error && !(blockLimitError && allowExecutionOverBlocksLimit) ? 'has-error' : ''} ${blockLimitError && allowExecutionOverBlocksLimit ? 'has-warning' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={toggleCollapsed}>
            {collapsed ?
                <React.Fragment>
                    {blocksUsage.error
                        ? <span dangerouslySetInnerHTML={{__html: blocksUsage.error}}></span>
                        : <span>
                            {blocksUsage.blocksLimit - blocksUsage.blocksCurrent}/{blocksUsage.blocksLimit}
                        </span>
                    }
                </React.Fragment>
                :
                <React.Fragment>
                    {blocksUsage.error ? blocksUsage.error : <span>
                        {getMessageChoices('TASK_BLOCKS_LIMIT_EXPANDED', blocksUsage.blocksLimit - blocksUsage.blocksCurrent).format({
                            current: blocksUsage.blocksLimit - blocksUsage.blocksCurrent,
                            limit: blocksUsage.blocksLimit
                        })}
                        {limitations && ' (' + getMessage('TASK_BLOCKS_LIMIT_REMAINING') + ' ' + limitations + ')'}
                    </span>}
                </React.Fragment>
            }
            {onlyStepByStep &&
            <div>
                {getMessage('TASK_BLOCKS_LIMIT_EXECUTE_ONLY_WITH')}
                <Button
                    className="is-big fake-button"
                    intent={Intent.PRIMARY}
                    title={getMessage('CONTROL_STEP_BY_STEP')}
                    icon={<FontAwesomeIcon icon={faShoePrints}/>}
                />
            </div>}
        </div>
    );
}
