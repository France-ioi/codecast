import React, {ReactElement, useEffect, useRef, useState} from "react";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";
import {formatTaskInstructions} from './utils';
import {Button} from '@blueprintjs/core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {Screen} from '../common/screens';
import {ActionTypes as CommonActionTypes} from '../common/actionTypes';
import {useDispatch} from 'react-redux';
import {documentationConceptSelected} from './documentation/documentation_slice';
import {faMinus} from '@fortawesome/free-solid-svg-icons/faMinus';
import {TaskInstructionsTabs} from './instructions/TaskInstructionsTabs';
import {
    convertHtmlInstructionsToReact,
    getInstructionsForLevelSelector
} from './instructions/instructions';
import {memoize} from 'proxy-memoize';

export interface TaskInstructionsProps {
    changeDisplayShowMore?: (display: boolean) => void,
    missionRightSlot?: ReactElement,
    expanded?: boolean,
    hideShowMoreButton?: boolean,
}

export function TaskInstructions(props: TaskInstructionsProps) {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const taskVariant = useAppSelector(state => state.options.taskVariant);
    const contextId = useAppSelector(state => state.task.contextId);
    const isBackend = useAppSelector(state => state.options.backend);
    const [instructionsTitle, setInstructionsTitle] = useState(null);
    const [instructionsHtml, setInstructionsHtml] = useState(null);
    const [instructionsTabs, setInstructionsTabs] = useState(null);
    const instructionsRef = useRef<HTMLDivElement>();
    const screen = useAppSelector(state => state.screen);
    const documentationOpen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen;
    const dispatch = useDispatch();
    const platform = useAppSelector(state => state.options.platform);
    const [hasShortOrLong, setHasShortOrLong] = useState(false);
    const {
        html: newInstructionsHtml,
        title: newInstructionsTitle
    } = useAppSelector(memoize(getInstructionsForLevelSelector));

    const toggleTaskInstructions = () => {
        if (documentationOpen) {
            dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: null}});
        } else {
            dispatch(documentationConceptSelected('task-instructions'));
            dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.DocumentationSmall}});
        }
    };

    useEffect(() => {
        let instructionsJQuery = formatTaskInstructions(newInstructionsHtml, platform, taskLevel, taskVariant);
        let hasTabs = false;
        if (0 < instructionsJQuery.find('.instructions-tabs').length) {
            hasTabs = true;

            const tabsContainer = instructionsJQuery.find('.instructions-tabs');
            const tabs = tabsContainer.find('.instructions-tab').toArray().map((tabDiv: HTMLDivElement) => {
                return {
                    title: tabDiv.getAttribute('data-title'),
                    element: tabDiv,
                };
            })
            setInstructionsTabs(tabs);
        } else {
            setInstructionsTabs(null);
        }

        setInstructionsTitle(newInstructionsTitle);
        setInstructionsHtml(instructionsJQuery.html());

        let hasShortOrLongInstructions = 0 < instructionsJQuery.find('.short').length || 0 < instructionsJQuery.find('.long').length;
        setHasShortOrLong(hasShortOrLongInstructions);
        if (props.changeDisplayShowMore) {
            props.changeDisplayShowMore(hasShortOrLongInstructions || hasTabs);
        }

        setTimeout(() => {
            if (window.instructionsPostProcessing?.length) {
                for (let postProcessingCallback of window.instructionsPostProcessing) {
                    postProcessingCallback();
                }
            }
        });
    }, [contextId]);

    if (!instructionsHtml && !isBackend) {
        return null;
    }

    return (
        <div ref={instructionsRef} className={`task-mission ${props.expanded ? 'is-expanded' : ''} cursor-main-zone`} style={{fontSize: `${zoomLevel}rem`}} data-cursor-zone="instructions">
            {props.missionRightSlot}

            {instructionsTabs ?
                <TaskInstructionsTabs
                    tabs={instructionsTabs}
                    expanded={props.expanded}
                />
                :
                <div>{convertHtmlInstructionsToReact(instructionsHtml, platform)}</div>
            }

            {!props.hideShowMoreButton && !props.expanded && hasShortOrLong && <Button
                className="quickalgo-button mt-2"
                onClick={toggleTaskInstructions}
                icon={<FontAwesomeIcon icon={documentationOpen ? faMinus : faPlus}/>}
            >{getMessage(`TASK_INSTRUCTIONS_${documentationOpen ? 'LESS' : 'MORE'}`)}</Button>}
        </div>
    );
}

TaskInstructions.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
