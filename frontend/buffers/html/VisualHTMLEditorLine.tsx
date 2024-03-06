import React from "react";
import {Droppable} from "react-beautiful-dnd"
import {CodeSegment, CodeSegments, makeTag} from "./html_editor_config";
import {VisualHTMLEditorElement} from './VisualHTMLEditorElement';

interface LineProps {
    indent: number,
    id: string,
    lineContents: CodeSegments
}

const selfClosingTags = [
    'area', 'base', 'br', 'col', 'embed', 'hr',
    'img', 'link', 'meta', 'param', 'source'
]

export function VisualHTMLEditorLine(props: LineProps) {
    function setClasses(element: CodeSegment) {
        let classes: string = element.unlocked ? 'unlocked ' : 'locked '
        if (element.type !== 'text') {
            selfClosingTags.includes(element.value) ?
                classes += 'self-closing '
                :
                classes += element.type === 'opening' ? 'opening ' : 'closing '
        } else {
            classes += 'text '
        }
        return classes
    }

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
                                id={c.id}
                                key={c.id}
                                index={c.index!}
                                className={setClasses(c)}
                                childrenElements={makeTag(c)}
                                unlocked={c.unlocked}
                            />
                        })
                    }
                </div>
            )}
        </Droppable>
    );
}
