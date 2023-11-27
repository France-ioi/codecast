import React from "react";
import {useAppSelector} from "../../hooks";
import {cursorPositionToScreenCoordinates} from './cursor_tracking';
import {CursorPoint} from './actionTypes';

export interface CursorPositionProps {
    offset?: CursorPoint,
}

export function CursorPosition(props: CursorPositionProps) {
    const cursorPosition = useAppSelector(state => state.layout.cursorPosition);
    if (!cursorPosition) {
        return null;
    }

    const screenPosition = cursorPositionToScreenCoordinates(cursorPosition);
    if (!screenPosition) {
        return null;
    }

    const offset = props.offset ? props.offset : {x: 0, y: 0};

    return (
        <div className="cursor-shadow" style={{left: screenPosition.x + offset.x, top: screenPosition.y + offset.y}}>
        </div>
    );
}
