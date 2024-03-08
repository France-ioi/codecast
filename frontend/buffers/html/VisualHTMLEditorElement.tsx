import React from "react";
import {Draggable} from "react-beautiful-dnd"
import {getDragStyle} from './html_editor_config';

interface ElementProps {
    className: string
    unlocked: boolean
    childrenElements: string
    id: string
    index: number
}

export function VisualHTMLEditorElement(props: ElementProps) {
    return (
        <Draggable key={props.id} draggableId={props.id} index={props.index} isDragDisabled={!props.unlocked}>
            {(provided, snapshot) => (
                <span
                    className={props.className}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={getDragStyle(provided.draggableProps.style, snapshot)}
                >
                    {props.childrenElements}
                </span>
            )}
        </Draggable>
    )
}
