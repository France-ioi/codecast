import React, {useState} from "react";
import {Draggable} from "react-beautiful-dnd"
import {CodeSegment, getCodeSegmentClasses, getDragStyle, getDisplayedTag, TagType} from './html_editor_config';
import {OverlayTrigger, Popover} from 'react-bootstrap';
import {VisualHTMLEditorElementAttributes} from './VisualHTMLEditorElementAttributes';

interface ElementProps {
    codeSegment: CodeSegment,
}

export function VisualHTMLEditorElement(props: ElementProps) {
    const [showEdit, setShowEdit] = useState(false);

    const popoverStyle = {
        backgroundColor: "#dddddd",
        '--bs-popover-bg': '#dddddd'
    } as React.CSSProperties;

    const codeSegment = props.codeSegment;

    const className = getCodeSegmentClasses(codeSegment);
    const tag = getDisplayedTag(codeSegment);

    return (
        <Draggable key={codeSegment.id} draggableId={codeSegment.id} index={codeSegment.index} isDragDisabled={!codeSegment.unlocked}>
            {(provided, snapshot) => (
                <span
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={getDragStyle(provided.draggableProps.style, snapshot)}
                    ref={provided.innerRef}
                >
                    {TagType.Opening === codeSegment.type ?
                        <OverlayTrigger
                            placement="bottom"
                            trigger="click"
                            show={showEdit}
                            onToggle={setShowEdit}
                            overlay={
                                <Popover style={popoverStyle}>
                                    <VisualHTMLEditorElementAttributes
                                        codeSegment={codeSegment}
                                        onClose={() => setShowEdit(false)}
                                    />
                                </Popover>
                            }
                            rootClose
                        >
                            {({ref, ...triggerHandler}) => (
                                <span
                                    ref={ref}
                                    className={className}
                                    {...triggerHandler}
                                >
                                    {tag}
                                </span>
                            )}
                        </OverlayTrigger>
                        :
                        <span
                            className={className}
                        >
                            {tag}
                        </span>
                    }
                </span>
            )}
        </Draggable>
    )
}
