import React, {useContext, useState} from 'react';
import {TaskInstructionsTab} from './TaskInstructionsTab';
import {ActionTypes as LayoutActionTypes} from '../layout/actionTypes';
import {useDispatch} from 'react-redux';
import {useAppSelector} from '../../hooks';
import {InstructionsContext} from '../../contexts';

export interface TaskInstructionsTabsProps {
    tabs: {title: string, element: HTMLDivElement}[],
    expanded: boolean,
}

export function TaskInstructionsTabs(props: TaskInstructionsTabsProps) {
    const tabs = props.tabs;
    const {visible} = useContext(InstructionsContext);
    const activeTabIndex = useAppSelector(state => !visible ? 0 : state.layout.instructions.tabIndex);
    const activeTab = tabs[activeTabIndex];
    const dispatch = useDispatch();

    const setActiveTabIndex = (tabIndex: number) => {
        dispatch({type: LayoutActionTypes.LayoutInstructionsIndexChanged, payload: {tabIndex, pageIndex: 0}});
    };

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
                tabIndex={activeTabIndex}
                tab={activeTab.element}
                expanded={props.expanded}
            />
        </div>
    );
}
