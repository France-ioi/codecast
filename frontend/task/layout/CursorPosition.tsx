import React from "react";
import {useAppSelector} from "../../hooks";
import {cursorPositionToScreenCoordinates} from './cursor_tracking';

export function CursorPosition() {
    const cursorPosition = useAppSelector(state => state.layout.cursorPosition);
    if (!cursorPosition) {
        return null;
    }

    const screenPosition = cursorPositionToScreenCoordinates(cursorPosition);
    if (!screenPosition) {
        return null;
    }

    return (
        <div className="cursor-shadow" style={{left: screenPosition.x, top: screenPosition.y}}>
        </div>
    );
}
