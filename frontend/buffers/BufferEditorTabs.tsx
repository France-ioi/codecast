import React from "react";
import {useAppSelector} from '../hooks';
import {BufferEditorTab} from './BufferEditorTab';
import {selectSourceBuffers} from './buffer_selectors';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {useDispatch} from 'react-redux';
import {bufferCreateSourceBuffer} from './buffer_actions';
import {SubmissionResultsSelector} from '../submission/SubmissionResultsSelector';

export interface BufferEditorTabsProps {
}

export function BufferEditorTabs(props: BufferEditorTabsProps) {
    const sourceBuffers = useAppSelector(selectSourceBuffers);
    const dispatch = useDispatch();

    const createNewTab = () => {
        dispatch(bufferCreateSourceBuffer());
    };

    if (0 === Object.keys(sourceBuffers).length) {
        return null;
    }

    return (
        <div className="layout-editor-tabs">
            <div className="layout-editor-tabs-section">
                {Object.entries(sourceBuffers).map(([bufferName, buffer]) =>
                    <BufferEditorTab
                        key={bufferName}
                        buffer={buffer}
                        bufferName={bufferName}
                    />
                )}
            </div>
            <div className="layout-editor-tabs-end">
                <div className="layout-editor-tabs-option">
                    <SubmissionResultsSelector/>
                </div>
                <div className="layout-editor-tabs-option" onClick={createNewTab}>
                    <FontAwesomeIcon icon={faPlus}/>
                </div>
            </div>
        </div>
    );
}
