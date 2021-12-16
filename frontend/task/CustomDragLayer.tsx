import React from 'react';
import {useDragLayer} from 'react-dnd';

export const CustomDragLayer = () => {
    const { itemType, isDragging, item, currentOffset, clientOffset } = useDragLayer((monitor) => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
        clientOffset: monitor.getClientOffset()
    }));
    if (!isDragging) {
        return null;
    }

    let position = {
        x: clientOffset && clientOffset.x ? clientOffset.x : 0,
        y: clientOffset && clientOffset.y ? clientOffset.y : 0,
    };

    if ('block' === itemType) {
        position.x -= 3;
        position.y -= 22;
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
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
        >
            <div id="custom-drag-layer" className="custom-drag-layer">
                <div className="task-available-block">
                    <div className="task-available-block-name">
                        {item.block.caption}
                    </div>
                </div>
            </div>
        </div>
    );
};
