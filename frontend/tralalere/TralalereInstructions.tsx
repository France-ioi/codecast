import {TaskInstructions} from "../task/TaskInstructions";
import React from "react";

export interface TralalereInstructionsProps {
    expanded?: boolean
    onExpand?: Function
}

export function TralalereInstructions(props: TralalereInstructionsProps) {
    return (
        <div className={`tralalere-instructions ${props.expanded ? 'is-expanded' : ''}`}>
            {/*{props.expanded ?*/}
            <img className="tralalere-instructions-shadow-down"
                src={window.modulesPath + 'img/algorea/crane/instructions-shadow-down.png'}/>
            {/*:*/}
            {/*<img className="tralalere-instructions-shadow-right"*/}
            {/*     src={window.modulesPath + 'img/algorea/crane/instructions-shadow-right.png'}/>*/}
            {/*}*/}

            <img className="tralalere-instructions-window" src={window.modulesPath + 'img/algorea/crane/instructions-window.png'}/>
            {/*{!props.expanded && <div className="tralalere-instructions-around-left"/>}*/}
            <img className="tralalere-instructions-left" src={window.modulesPath + 'img/algorea/crane/instructions-left-folded.png'}/>
            <div className="tralalere-instructions-container">
                <TaskInstructions/>

                <div>
                    <div className="tralalere-button" onClick={() => props.onExpand()}>
                        {props.expanded ? '-' : '+'}
                    </div>
                </div>
            </div>
        </div>
    );
}