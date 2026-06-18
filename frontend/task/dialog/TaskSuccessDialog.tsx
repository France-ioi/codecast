import {Dialog, Icon} from "@blueprintjs/core";
import React from "react";
import {useAppSelector} from "../../hooks";
import {useDispatch} from "react-redux";
import {taskLevelsList} from "../platform/platform_slice";
import {callPlatformShowView, callPlatformValidate} from '../../submission/submission_actions';
import {taskChangeLevel} from '../task_actions';
import {getNextLevelIndex} from '../platform/platform';
import {SmallTick} from '@blueprintjs/icons';
import {getMessage} from '../../lang/messages';
import {getTaskSolution} from '../instructions/instructions';
import {LayoutView} from '../layout/layout_types';

export interface TaskSuccessDialogProps {
    onClose: () => void,
}

export function TaskSuccessDialog(props: TaskSuccessDialogProps) {
    const taskSuccessMessage = useAppSelector(state => state.task.successMessage);
    const taskSuccessStayOnCurrentVersionDisabled = useAppSelector(state => state.options.taskSuccessStayOnCurrentVersionDisabled);
    const levels = useAppSelector(state => state.platform.levels);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const forceNextTaskAfter = currentTask?.gridInfos?.forceNextTaskAfter;
    const dispatch = useDispatch();
    const hasSolution = !!useAppSelector(getTaskSolution);

    let currentLevelFinished = false;
    let nextLevel = null;
    if (currentLevel && currentLevel in levels) {
        currentLevelFinished = (levels[currentLevel].score >= 1);
        if (currentLevelFinished) {
            nextLevel = getNextLevelIndex(levels, currentLevel);
        }
    }
    const hasNextLevel = null !== nextLevel;

    let intermediateMessage = null;
    let nextAction = 'nextLevel';
    if (currentLevelFinished) {
        if (hasNextLevel) {
            const levelIndex = taskLevelsList.indexOf(currentLevel);
            if (forceNextTaskAfter === levelIndex) {
                intermediateMessage = <p>{getMessage('TASK_LEVEL_SUCCESS_TRY_NEXT_TASK')}</p>
                nextAction = 'top';
            } else {
                intermediateMessage = <p>{getMessage('TASK_LEVEL_SUCCESS_NEXT_LABEL').format({version: getMessage('TASK_LEVEL_VERSION').format({count: nextLevel + 1})})}</p>;
            }
        } else {
            intermediateMessage = <p>{getMessage('TASK_LEVEL_SUCCESS_FINISHED')}</p>;
            nextAction = 'nextImmediate';
        }
    }

    const triggerNextAction = () => {
        props.onClose();
        if ('nextLevel' === nextAction) {
            dispatch(taskChangeLevel(taskLevelsList[nextLevel]));
        } else {
            dispatch(callPlatformValidate(nextAction));
        }
    };

    const showSolution = () => {
        dispatch(callPlatformShowView(LayoutView.Solution));
        props.onClose();
    };

    return (
        <Dialog isOpen={true} className="simple-dialog" onClose={props.onClose}>
            {taskSuccessMessage && <p className="simple-dialog-success">{taskSuccessMessage}</p>}

            {intermediateMessage}
            {!currentLevelFinished && <p>{getMessage('TASK_LEVEL_SUCCESS_FINISHED')}</p>}

            {!hasNextLevel && hasSolution && <p>
                {getMessage('TASK_LEVEL_SUCCESS_SHOW_SOLUTION_INCITATIVE')}
            </p>}

            <div className="simple-dialog-buttons">
                {currentLevelFinished
                    ? (hasNextLevel
                        ? <>
                            <button className="simple-dialog-button" onClick={triggerNextAction}>
                                <Icon icon={<SmallTick/>} size={24}/>
                                <span>{getMessage('TASK_LEVEL_SUCCESS_NEXT_BUTTON')}</span>
                            </button>
                            {!taskSuccessStayOnCurrentVersionDisabled &&
                                <button className="simple-dialog-button ml-2" onClick={props.onClose}>
                                    <span>{getMessage('TASK_LEVEL_SUCCESS_STAY_BUTTON')}</span>
                                </button>
                            }
                        </>
                        : <>
                            <button className="simple-dialog-button" onClick={triggerNextAction}>
                                <Icon icon={<SmallTick/>} size={24}/>
                                <span>{getMessage('TASK_LEVEL_SUCCESS_NEXT_BUTTON')}</span>
                            </button>
                            <button className="simple-dialog-button ml-2" onClick={props.onClose}>
                                <span>{getMessage('TASK_LEVEL_SUCCESS_STAY_LEVEL_BUTTON')}</span>
                            </button>
                        </>
                    )
                    : (hasSolution ?
                        <button className="simple-dialog-button" onClick={showSolution}>
                            <span>{getMessage('TASK_LEVEL_SUCCESS_SHOW_SOLUTION')}</span>
                        </button>
                        :
                        <button className="simple-dialog-button" onClick={props.onClose}>
                            <Icon icon={<SmallTick/>} size={24}/>
                            <span>{getMessage('OK')}</span>
                        </button>
                    )
                }
            </div>
        </Dialog>
    );
}
