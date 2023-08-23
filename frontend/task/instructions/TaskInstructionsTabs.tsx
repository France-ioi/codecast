import React, {useEffect, useState} from 'react';
import {TaskInstructionsTab} from './TaskInstructionsTab';

export interface TaskInstructionsTabsProps {
    tabs: {title: string, element: HTMLDivElement}[],
}

export function TaskInstructionsTabs(props: TaskInstructionsTabsProps) {
    const tabs = props.tabs;
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const activeTab = tabs[activeTabIndex]

    return (
        <div className="task-instructions-tabs">
            <div className="task-instructions-tabs-selector">
                {tabs.map((tab, tabIndex) =>
                    <div
                        className={`task-instructions-tabs-selector-tab ${activeTabIndex === tabIndex ? 'is-active' : ''}`}
                        onClick={() => setActiveTabIndex(tabIndex)}
                        key={tabIndex}
                    >
                        {tab.title}
                    </div>
                )}
            </div>

            <TaskInstructionsTab
                tab={activeTab.element}
            />
        </div>
    );
}
