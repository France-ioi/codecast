import React from 'react';
import {DragLayer, useDragLayer} from 'react-dnd';

export const CustomDragLayer = (props) => {
    const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
    }));
    if (!isDragging) {
        return null;
    }
    return (<div
            role="presentation"
            style={{
                position: "fixed",
                pointerEvents: "none",
                top: 0,
                left: 0,
                zIndex: 100,
                width: '100%',
                height: '100%',
                display: 'inline-block',
                transform: `translate(${currentOffset && currentOffset.x ? currentOffset.x : 0}px, ${currentOffset && currentOffset.y ? currentOffset.y : 0}px)`,
            }}
        >
            <div id="custom-drag-layer" className="custom-drag-layer">
                <div>Draggable</div>
            </div>
        </div>
    );
};
