import React, {useEffect, useRef, useState} from "react";
import {BufferState} from './buffer_types';
import {platformsList} from '../stepper/platforms';
import {useAppSelector} from '../hooks';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useDispatch} from 'react-redux';
import {bufferChangeActiveBufferName, bufferRemove} from './buffers_slice';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {selectSourceBuffers} from './buffer_selectors';
import {TaskSubmission} from '../submission/submission_types';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {OverlayTrigger, Popover} from "react-bootstrap";
import {BufferEditorTabEdit} from './BufferEditorTabEdit';
import {faBell} from '@fortawesome/free-solid-svg-icons/faBell';
import {faArrowCircleUp} from '@fortawesome/free-solid-svg-icons/faArrowCircleUp';
import {faArrowCircleDown} from '@fortawesome/free-solid-svg-icons/faArrowCircleDown';
import {bufferGitOpenPushDialog, bufferGitPull} from './buffer_actions';
import {GitCommitDialog} from './GitCommitDialog';
import {GitResolveConflictsDialog} from './GitResolveConflictsDialog';

export interface BufferEditorTabProps {
    bufferName: string,
    buffer: BufferState,
}

export function BufferEditorTab(props: BufferEditorTabProps) {
    const {buffer, bufferName} = props;
    const fileName = `${buffer.fileName}.${platformsList[buffer.platform].extension}`;
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);
    const sourceBuffers = useAppSelector(selectSourceBuffers);
    const sourceBuffer = sourceBuffers[bufferName];
    const isActive = activeBufferName === bufferName;
    const dispatch = useDispatch();
    const submissionIndex = buffer.submissionIndex;
    const submission: TaskSubmission|null = useAppSelector(state => null !== submissionIndex && undefined !== submissionIndex ? state.submission.taskSubmissions[submissionIndex] : null);
    const isEvaluating = submission && !submission.evaluated && !submission.crashed;
    const hasResults = submission && !isEvaluating;
    const isEditable = null === submissionIndex;
    const [showEdit, setShowEdit] = useState(false);
    const [isFlashing, setFlashing] = useState(false);
    const waitingEvaluation = useRef<boolean>(false);

    useEffect(() => {
        if (isEvaluating) {
            waitingEvaluation.current = true;
        }
    }, [isEvaluating]);

    useEffect(() => {
        if (hasResults && waitingEvaluation.current) {
            waitingEvaluation.current = false;
            setFlashing(!isActive);
        } else {
            setFlashing(false);
        }
    }, [hasResults, isActive]);

    const changeTab = () => {
        if (activeBufferName !== bufferName) {
            dispatch(bufferChangeActiveBufferName(bufferName));
        }
    };

    const closeTab = (e) => {
        e.stopPropagation();
        dispatch(bufferRemove(bufferName));
    };

    const closable = Object.keys(sourceBuffers).length > 1;

    const popoverStyle = {
        backgroundColor: "#dddddd",
        '--bs-popover-bg': '#dddddd'
    } as React.CSSProperties;

    const gitPull = () => {
        dispatch(bufferGitPull(bufferName));
    };

    const gitPush = () => {
        dispatch(bufferGitOpenPushDialog(bufferName));
    };

    return (
        <OverlayTrigger
            placement="bottom"
            trigger="click"
            show={showEdit}
            onToggle={setShowEdit}
            overlay={
                <Popover style={popoverStyle}>
                    <BufferEditorTabEdit
                        bufferName={bufferName}
                        onClose={() => setShowEdit(false)}
                    />
                </Popover>
            }
            rootClose
        >
            {({ ref, ...triggerHandler }) => (
                <div className={`layout-editor-tab ${isActive ? 'is-active' : ''} ${isFlashing ? 'is-flashing' : ''}`} onClick={changeTab} ref={ref}>
                    {hasResults && <React.Fragment>
                        <FontAwesomeIcon icon={faBell} className={`icon-bell ${isFlashing ? 'is-animated' : ''}`}/>
                        <span>{fileName}</span>
                    </React.Fragment>}
                    {isEvaluating && <React.Fragment>
                        <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
                        <span>{fileName}</span>
                    </React.Fragment>}
                    {isEditable && <div {...(isActive ? triggerHandler : {})} className={isActive ? 'has-pointer' : ''}>
                        {fileName}
                    </div>}
                    {sourceBuffer.gitSync && isActive && <div className="git-sync-tab">
                        {sourceBuffer.gitSync.loading ?
                            <FontAwesomeIcon icon={faSpinner} className="fa-spin"/>
                            :
                            <>
                                <FontAwesomeIcon icon={faArrowCircleDown} onClick={gitPull} title="Pull"/>
                                <FontAwesomeIcon icon={faArrowCircleUp} onClick={gitPush} title="Push"/>
                            </>
                        }
                    </div>}
                    {closable && <div className="layout-editor-tab-close" onClick={closeTab}>
                        <FontAwesomeIcon icon={faTimes}/>
                    </div>}

                    {sourceBuffer.gitSync?.commitModalOpen && <GitCommitDialog
                        bufferName={bufferName}
                    />}

                    {sourceBuffer.gitSync?.conflictSource && <GitResolveConflictsDialog
                        bufferName={bufferName}
                    />}
                </div>
            )}
        </OverlayTrigger>
    );
}
