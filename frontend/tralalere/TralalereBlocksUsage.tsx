import React, {useRef} from "react";
import {useAppSelector} from "../hooks";
import {AppStore} from "../store";
import {getMessageChoices} from "../lang";

export function TralalereBlocksUsage() {
    const blocksUsage = useAppSelector(state => state.task.blocksUsage);
    const platform = useAppSelector((state: AppStore) => state.options.platform);

    const wrapperRef = useRef<HTMLDivElement>();

    if (!blocksUsage || !blocksUsage.blocksLimit || Infinity === blocksUsage.blocksLimit) {
        return null;
    }

    return (
        <div ref={wrapperRef} className={`tralalere-blocks-usage ${blocksUsage.error ? 'has-error' : ''} platform-${platform}`}>
            <span>
                {getMessageChoices('TASK_BLOCKS_REMAINING_BLOCKS', blocksUsage.blocksLimit - blocksUsage.blocksCurrent).format({
                    remaining: `${blocksUsage.blocksCurrent} / ${blocksUsage.blocksLimit}`
                })}
            </span>
            <img className="tralalere-box-small-right" src={window.modulesPath + 'img/algorea/crane/box_right.svg'}/>
            <div className={`block-usage-status ${blocksUsage.blocksLimit === blocksUsage.blocksCurrent ? 'is-warning' : (blocksUsage.blocksLimit < blocksUsage.blocksCurrent ? 'is-error' : '')}`}/>
        </div>
    );
}
