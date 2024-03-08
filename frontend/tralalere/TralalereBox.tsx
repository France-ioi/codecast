import React from "react";
import { getTralalereImg } from "./tralalere_assets";

export interface TralalereBoxProps {
    children: JSX.Element | JSX.Element[],
}

export function TralalereBox(props: TralalereBoxProps) {
    return (
        <div className="tralalere-box">
            {props.children}
            <img className="blockly-flyout-wrapper-bottom" src={getTralalereImg('editor-bottom-background.png')}/>
        </div>
    )
}
