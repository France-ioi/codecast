import React from "react";
import {VisualHTMLEditorLineCounterCell} from './VisualHTMLEditorLineCounterCell';

interface LineCountProps {
    lineCount: number
}

export function VisualHTMLEditorLineCounter(props: LineCountProps) {
    let lineCells = []
    for (let i = 0; i < props.lineCount; i++) {
        lineCells.push(i)
    }

    return (
        <div className={'lines-counter-inner'}>
            {lineCells.map((line, index) => {
                return <VisualHTMLEditorLineCounterCell key={index} line={line + 1}/>
            })}
        </div>
    )
}
