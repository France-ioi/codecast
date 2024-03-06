import React from "react";

interface LineCounterCellProps {
    line: number
}

export function VisualHTMLEditorLineCounterCell(props: LineCounterCellProps) {
    return (
        <div className={'lines-counter-cell'}>
            {props.line}
        </div>
    )
}
