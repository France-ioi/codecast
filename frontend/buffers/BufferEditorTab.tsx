import React from "react";
import {BufferState} from './buffer_types';

export interface BufferEditorTabProps {
    bufferName: string,
    buffer: BufferState,
}

export function BufferEditorTab(props: BufferEditorTabProps) {
    return (
        <div className="layout-editor-tab">
            active tab
        </div>
    );
}
