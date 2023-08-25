import React, {useEffect, useRef} from 'react';
import {convertHtmlInstructionsToReact} from './instructions';
import {useAppSelector} from '../../hooks';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft} from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import {faChevronRight} from '@fortawesome/free-solid-svg-icons';
import {useDispatch} from 'react-redux';
import {ActionTypes as LayoutActionTypes} from '../layout/actionTypes';

export interface TaskInstructionsTabProps {
    tabIndex: number
    tab: HTMLDivElement,
    expanded: boolean,
}

export function TaskInstructionsTab(props: TaskInstructionsTabProps) {
    const platform = useAppSelector(state => state.options.platform);
    const tab = props.tab;
    const pages = tab.querySelectorAll('.instructions-page');
    const activePageIndex = useAppSelector(state => state.layout.instructions.pageIndex);
    const maxHeight = useAppSelector(state => state.layout.instructions.maxHeight);
    const activePage = pages[activePageIndex];
    const dispatch = useDispatch();
    const mainRef = useRef<HTMLDivElement>();

    const setActivePageIndex = (pageIndex: number) => {
        dispatch({type: LayoutActionTypes.LayoutInstructionsIndexChanged, payload: {pageIndex}});
    };

    useEffect(() => {
        if (0 === props.tabIndex && 0 === activePageIndex) {
            setTimeout(() => {
                const container = mainRef.current.querySelectorAll('.task-instructions-tabs-content-inside');
                if (container.length) {
                    const maxHeight = container[0].clientHeight;
                    dispatch({type: LayoutActionTypes.LayoutInstructionsIndexChanged, payload: {maxHeight}});
                }
            });
        }
    }, [props.tabIndex, activePageIndex]);

    const style = !props.expanded && maxHeight ? {height: maxHeight + 'px', overflow: 'hidden'} : {};

    if (0 === pages.length) {
        return (
            <div className="task-instructions-tabs-content" ref={mainRef}>
                <div className="task-instructions-tabs-content-inside" style={style}>
                    {convertHtmlInstructionsToReact(tab.innerHTML, platform)}
                </div>
            </div>
        );
    }

    return (
        <div className="task-instructions-tabs-pages-container" ref={mainRef}>
            {activePageIndex > 0 && <div className="task-instructions-tabs-pages-arrow">
                <div className="task-instructions-tabs-arrow-button" onClick={() => setActivePageIndex(activePageIndex - 1)}>
                    <FontAwesomeIcon icon={faChevronLeft}/>
                </div>
            </div>}
            <div className={`task-instructions-tabs-content ${activePage.classList.contains('is-dark') ? 'is-dark' : ''}`}>
                <div className="task-instructions-tabs-content-inside" style={style}>
                    {convertHtmlInstructionsToReact(activePage.innerHTML, platform)}
                </div>
            </div>
            {activePageIndex < pages.length - 1 && <div className="task-instructions-tabs-pages-arrow">
                <div className="task-instructions-tabs-arrow-button" onClick={() => setActivePageIndex(activePageIndex + 1)}>
                    <FontAwesomeIcon icon={faChevronRight}/>
                </div>
            </div>}
        </div>
    )
}
