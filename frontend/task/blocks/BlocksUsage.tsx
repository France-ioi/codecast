import React, {useEffect, useRef, useState} from "react";
import {useAppSelector} from "../../hooks";
import {getMessage, getMessageChoices} from "../../lang";

export function BlocksUsage() {
    const blocksUsage = useAppSelector(state => state.task.blocksUsage);
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

    if (!blocksUsage) {
        return null;
    }

    const limitations = blocksUsage.limitations ? blocksUsage.limitations.map(limitation => {
        return getMessageChoices('TASK_BLOCKS_LIMIT_BLOCK', limitation.limit - limitation.current).format({
            remaining: limitation.limit - limitation.current,
            name: limitation.name,
        });
    }).join(', ') : null;

    return (
        <div ref={wrapperRef} className={`blocks-usage ${blocksUsage.error ? 'has-error' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={toggleCollapsed}>
            {collapsed ?
                <React.Fragment>
                    {blocksUsage.error ? blocksUsage.error : <span>
                        {blocksUsage.blocksLimit - blocksUsage.blocksCurrent}/{blocksUsage.blocksLimit}
                    </span>}
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
        </div>
    );
}
