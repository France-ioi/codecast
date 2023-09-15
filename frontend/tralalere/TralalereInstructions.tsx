import {TaskInstructions} from "../task/TaskInstructions";
import React, {useState} from "react";
import {LayoutType} from "../task/layout/layout";
import {useAppSelector} from "../hooks";

export interface TralalereInstructionsProps {
    expanded?: boolean,
    absolute?: boolean,
    onExpand?: Function,
    style?: any,
}

export function TralalereInstructions(props: TralalereInstructionsProps) {
    const [displayExpanded, setDisplayExpanded] = useState(false);
    const isMobile = useAppSelector(state => LayoutType.MobileHorizontal === state.layout.type || LayoutType.MobileVertical ===  state.layout.type);

    return (
        <div className={`tralalere-instructions ${props.expanded ? 'is-expanded' : ''} ${props.absolute ? 'is-absolute' : ''} ${displayExpanded ? 'show-more': ''}`} style={props.style}>
            <img className="tralalere-instructions-shadow-down tralalere-instructions-design"
                src={window.modulesPath + 'img/algorea/crane/instructions-shadow-down.png'}/>
            <img className="tralalere-instructions-window  tralalere-instructions-design" src={window.modulesPath + 'img/algorea/crane/instructions-window.png'}/>
            <img className="tralalere-instructions-left  tralalere-instructions-design" src={window.modulesPath + 'img/algorea/crane/instructions-left-folded.png'}/>
            <div className="tralalere-instructions-container">
                <TaskInstructions
                    withoutTitle
                    expanded={props.expanded}
                    changeDisplayShowMore={(displayExpanded) => setDisplayExpanded(displayExpanded)}
                    hideShowMoreButton
                    missionRightSlot={
                        (isMobile || displayExpanded) && <div className="tralalere-instructions-more">
                            <div className="tralalere-button" onClick={() => props.onExpand()}>
                                {props.expanded ? '-' : '+'}
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
