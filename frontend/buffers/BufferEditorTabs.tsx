import React from "react";
import {useAppSelector} from '../hooks';
import {BufferEditorTab} from './BufferEditorTab';
import {selectSourceBuffers} from './buffer_selectors';

export interface BufferEditorTabsProps {
}

export function BufferEditorTabs(props: BufferEditorTabsProps) {
    const sourceBuffers = useAppSelector(selectSourceBuffers);

    return (
        <div className="layout-editor-tabs">
            {Object.entries(sourceBuffers).map(([bufferName, buffer]) =>
                <BufferEditorTab
                    key={bufferName}
                    buffer={buffer}
                    bufferName={bufferName}
                />
            )}
        </div>
    );
}
