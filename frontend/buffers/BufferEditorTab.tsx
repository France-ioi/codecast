import React from "react";
import {BufferState} from './buffer_types';
import {platformsList} from '../stepper/platforms';
import {useAppSelector} from '../hooks';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useDispatch} from 'react-redux';
import {bufferChangeActiveBufferName, bufferRemove} from './buffers_slice';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {selectSourceBuffers} from './buffer_selectors';
import {TaskSubmission} from '../submission/submission_types';
import {getMessage} from '../lang';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';

export interface BufferEditorTabProps {
    bufferName: string,
    buffer: BufferState,
}

export function BufferEditorTab(props: BufferEditorTabProps) {
    const {buffer, bufferName} = props;
    const fileName = `${buffer.fileName}.${platformsList[buffer.platform].extension}`;
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);
    const sourceBuffers = useAppSelector(selectSourceBuffers);
    const isActive = activeBufferName === bufferName;
    const dispatch = useDispatch();
    const submissionIndex = buffer.submissionIndex;
    const submission: TaskSubmission|null = useAppSelector(state => null !== submissionIndex && undefined !== submissionIndex ? state.submission.taskSubmissions[submissionIndex] : null);
    const isEvaluating = submission && !submission.evaluated && !submission.crashed;
    const hasResults = submission && !isEvaluating;

    const changeTab = () => {
        dispatch(bufferChangeActiveBufferName(bufferName));
    };

    const closeTab = (e) => {
        e.stopPropagation();
        dispatch(bufferRemove(bufferName));
    };

    const closable = Object.keys(sourceBuffers).length > 1;

    return (
        <div className={`layout-editor-tab ${isActive ? 'is-active' : ''}`} onClick={changeTab}>
            {hasResults && <React.Fragment>
                <span>{getMessage('BUFFER_TAB_FINISHED_SUBMISSION')}</span>
            </React.Fragment>}
            {isEvaluating && <React.Fragment>
                <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
                <span className="ml-1">{getMessage('BUFFER_TAB_PENDING_SUBMISSION')}</span>
            </React.Fragment>}
            {null === submission && <React.Fragment>
                {fileName}
            </React.Fragment>}
            {closable && <div className="layout-editor-tab-close" onClick={closeTab}>
                <FontAwesomeIcon icon={faTimes}/>
            </div>}
        </div>
    );
}
