import React, {useCallback, useEffect, useRef, useState} from "react";
import {useAppSelector} from '../hooks';
import {BufferEditorTab} from './BufferEditorTab';
import {selectSourceBuffers} from './buffer_selectors';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {useDispatch} from 'react-redux';
import {bufferCreateSourceBuffer} from './buffer_actions';
import {SubmissionResultsSelector} from '../submission/SubmissionResultsSelector';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import {faArrowRight} from '@fortawesome/free-solid-svg-icons/faArrowRight';

export interface BufferEditorTabsProps {
}

export function BufferEditorTabs(props: BufferEditorTabsProps) {
    const sourceBuffers = useAppSelector(selectSourceBuffers);
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);
    const dispatch = useDispatch();

    const createNewTab = () => {
        dispatch(bufferCreateSourceBuffer());
    };

    const [isLeftArrowDisabled, setIsLeftArrowDisabled] = useState(false);
    const [isRightArrowDisabled, setIsRightArrowDisabled] = useState(false);
    const tabsContainerRef = useRef<HTMLDivElement>();

    const scrollIncrement = 600;

    const updateArrows = () => {
        if (!tabsContainerRef.current) {
            return;
        }

        const currentScroll = tabsContainerRef.current.scrollLeft;
        setIsLeftArrowDisabled(currentScroll <= 0);
        setIsRightArrowDisabled(currentScroll + tabsContainerRef.current.clientWidth >= tabsContainerRef.current.scrollWidth);
    }

    const scrollToDirection = (multiplier: number) => {
        const currentScroll = tabsContainerRef.current.scrollLeft;
        tabsContainerRef.current.scrollTo({left: currentScroll + scrollIncrement * multiplier, behavior: 'smooth'});
        updateArrows();
    };

    const onScroll = () => {
        //TODO : debounce this
        updateArrows();
    }

    useEffect(() => {
        updateArrows();
    }, [sourceBuffers]);

    useEffect(() => {
        const tabIndex = Object.keys(sourceBuffers).indexOf(activeBufferName);
        if (!tabsContainerRef.current) {
            return;
        }
        const child = tabsContainerRef.current.children[tabIndex];
        if (child) {
            setTimeout(() => {
                child.scrollIntoView({behavior: 'smooth'});
            });
        }
    }, [activeBufferName]);

    const hasArrows = !isLeftArrowDisabled || !isRightArrowDisabled;

    if (0 === Object.keys(sourceBuffers).length) {
        return null;
    }

    return (
        <div className="layout-editor-tabs">
            <div className="layout-editor-tabs-section">
                {hasArrows && <div className="rts___nav___btn___container">
                    <button
                        type="button"
                        className="rts___btn rts___nav___btn rts___left___nav___btn"
                        disabled={isLeftArrowDisabled}
                        onClick={() => scrollToDirection(-1)}
                    >
                        <FontAwesomeIcon icon={faArrowLeft}/>
                    </button>
                </div>}

                <div
                    className={`layout-editor-tabs-container rts___tabs hide___rts___tabs___scroll ${hasArrows ? 'has-arrows' : ''}`}
                    ref={tabsContainerRef}
                    onScroll={onScroll}
                >
                    {Object.entries(sourceBuffers).map(([bufferName, buffer]) =>
                        <BufferEditorTab
                            key={bufferName}
                            buffer={buffer}
                            bufferName={bufferName}
                        />
                    )}
                </div>

                {hasArrows && <div className="rts___nav___btn___container">
                    <button
                        type="button"
                        className="rts___btn rts___nav___btn rts___right___nav___btn"
                        disabled={isRightArrowDisabled}
                        onClick={() => scrollToDirection(1)}
                    >
                        <FontAwesomeIcon icon={faArrowRight}/>
                    </button>
                </div>}
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
