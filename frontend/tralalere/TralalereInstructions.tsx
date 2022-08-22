import {TaskInstructions} from "../task/TaskInstructions";
import React, {useState} from "react";

export interface TralalereInstructionsProps {
    expanded?: boolean
    onExpand?: Function
}

export function TralalereInstructions(props: TralalereInstructionsProps) {
    const [displayExpanded, setDisplayExpanded] = useState(false);

    return (
        <div className={`tralalere-instructions ${props.expanded ? 'is-expanded' : ''}`}>
            <img className="tralalere-instructions-shadow-down"
                src={window.modulesPath + 'img/algorea/crane/instructions-shadow-down.png'}/>
            <img className="tralalere-instructions-window" src={window.modulesPath + 'img/algorea/crane/instructions-window.png'}/>
            <img className="tralalere-instructions-left" src={window.modulesPath + 'img/algorea/crane/instructions-left-folded.png'}/>
            <div className="tralalere-instructions-container">
                <TaskInstructions
                    changeDisplayShowMore={(displayExpanded) => setDisplayExpanded(displayExpanded)}
                />

                {displayExpanded && <div>
                    <div className="tralalere-button" onClick={() => props.onExpand()}>
                        {props.expanded ? '-' : '+'}
                    </div>
                </div>}
            </div>
        </div>
    );
}