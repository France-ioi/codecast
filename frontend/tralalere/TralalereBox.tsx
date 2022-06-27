import React, {ReactElement} from "react";

export interface TralalereBoxProps {
    children: ReactElement,
}

export function TralalereBox(props: TralalereBoxProps) {
    return (
        <div className="tralalere-box">
            {props.children}
            <img className="blockly-flyout-wrapper-bottom" src={window.modulesPath + 'img/algorea/crane/editor-bottom-background.png'}/>
        </div>
    )
}
