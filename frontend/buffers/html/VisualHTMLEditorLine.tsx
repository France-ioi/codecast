import React from "react";
import {Droppable} from "react-beautiful-dnd"
import {CodeSegment, CodeSegments, getDisplayedTag} from "./html_editor_config";
import {VisualHTMLEditorElement} from './VisualHTMLEditorElement';

interface LineProps {
    indent: number,
    id: string,
    lineContents: CodeSegments
}

export function VisualHTMLEditorLine(props: LineProps) {
    return (
        <Droppable key={props.id} droppableId={props.id} direction={"horizontal"}>
            {(provided, snapshot) => (
                <div
                    className={
                        snapshot.isDraggingOver ? 'line is-dragged-over' : 'line'
                    }
                    style={{paddingLeft: 35 * props.indent + 4}}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {
                        props.lineContents.map(c => {
                            return <VisualHTMLEditorElement
                                codeSegment={c}
                                key={c.id}
                            />
                        })
                    }
                </div>
            )}
        </Droppable>
    );
}
