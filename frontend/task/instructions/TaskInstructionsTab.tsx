import React, {useEffect, useState} from 'react';
import {convertHtmlInstructionsToReact} from './instructions';
import {useAppSelector} from '../../hooks';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft} from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import {faChevronRight} from '@fortawesome/free-solid-svg-icons';

export interface TaskInstructionsTabProps {
    tab: HTMLDivElement,
}

export function TaskInstructionsTab(props: TaskInstructionsTabProps) {
    const platform = useAppSelector(state => state.options.platform);
    const tab = props.tab;
    const pages = tab.querySelectorAll('.instructions-page');
    const [activePageIndex, setActivePageIndex] = useState(0);
    const activePage = pages[activePageIndex];

    useEffect(() => {
        setActivePageIndex(0);
    }, [tab]);

    if (0 === pages.length) {
        return (
            <div className="task-instructions-tabs-content">
                <div>{convertHtmlInstructionsToReact(tab.innerHTML, platform)}</div>
            </div>
        );
    }

    return (
        <div className="task-instructions-tabs-pages-container">
            {activePageIndex > 0 && <div className="task-instructions-tabs-pages-arrow">
                <div className="task-instructions-tabs-arrow-button" onClick={() => setActivePageIndex(activePageIndex - 1)}>
                    <FontAwesomeIcon icon={faChevronLeft}/>
                </div>
            </div>}
            <div className={`task-instructions-tabs-content ${activePage.classList.contains('is-dark') ? 'is-dark' : ''}`}>
                {convertHtmlInstructionsToReact(activePage.innerHTML, platform)}
            </div>
            {activePageIndex < pages.length - 1 && <div className="task-instructions-tabs-pages-arrow">
                <div className="task-instructions-tabs-arrow-button" onClick={() => setActivePageIndex(activePageIndex + 1)}>
                    <FontAwesomeIcon icon={faChevronRight}/>
                </div>
            </div>}
        </div>
    )
}
