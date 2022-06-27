import React from "react";

export interface TralalereBoxProps {
    children: JSX.Element | JSX.Element[],
}

export function TralalereBox(props: TralalereBoxProps) {
    return (
        <div className="tralalere-box">
            {props.children}
            <img className="blockly-flyout-wrapper-bottom" src={window.modulesPath + 'img/algorea/crane/editor-bottom-background.png'}/>
        </div>
    )
}
