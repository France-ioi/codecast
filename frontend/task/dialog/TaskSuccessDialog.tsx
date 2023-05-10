import {Dialog, Icon} from "@blueprintjs/core";
import React from "react";
import {useAppSelector} from "../../hooks";
import {useDispatch} from "react-redux";
import {getMessage} from "../../lang";
import {taskChangeLevel} from "../index";
import {taskLevelsList} from "../platform/platform_slice";
import {submissionTriggerPlatformValidate} from '../../submission/submission';

export interface TaskSuccessDialogProps {
    onClose: () => void,
}

export function TaskSuccessDialog(props: TaskSuccessDialogProps) {
    const taskSuccessMessage = useAppSelector(state => state.task.successMessage);
    const levels = useAppSelector(state => state.platform.levels);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const forceNextTaskAfter = currentTask?.gridInfos?.forceNextTaskAfter;
    const dispatch = useDispatch();

    let currentLevelFinished = false;
    let currentLevelIndex = null;
    let hasNextLevel = false;
    if (currentLevel && currentLevel in levels) {
        currentLevelFinished = (levels[currentLevel].score >= 1);
        currentLevelIndex = taskLevelsList.indexOf(currentLevel);
        hasNextLevel = currentLevelIndex + 1 < taskLevelsList.length && taskLevelsList[currentLevelIndex + 1] in levels;
    }

    let intermediateMessage = null;
    let nextAction = 'next-level';
    if (currentLevelFinished) {
        if (hasNextLevel) {
            const levelIndex = taskLevelsList.indexOf(currentLevel);
            if (forceNextTaskAfter === levelIndex) {
                intermediateMessage = <p>{getMessage('TASK_LEVEL_SUCCESS_TRY_NEXT_TASK')}</p>
                nextAction = 'top';
            } else {
                intermediateMessage = <p>{getMessage('TASK_LEVEL_SUCCESS_NEXT_LABEL').format({version: getMessage('TASK_LEVEL_VERSION').format({count: currentLevelIndex + 2})})}</p>;
            }
        } else {
            intermediateMessage = <p>{getMessage('TASK_LEVEL_SUCCESS_FINISHED')}</p>;
        }
    }

    const triggerNextAction = () => {
        props.onClose();
        if ('next-level' === nextAction) {
            dispatch(taskChangeLevel(taskLevelsList[currentLevelIndex + 1]));
        } else {
            dispatch(submissionTriggerPlatformValidate(nextAction));
        }
    }

    return (
        <Dialog isOpen={true} className="simple-dialog" onClose={props.onClose}>
            {taskSuccessMessage && <p className="simple-dialog-success">{taskSuccessMessage}</p>}

            {intermediateMessage}
            {!currentLevelFinished && <p>{getMessage('TASK_LEVEL_SUCCESS_FINISHED')}</p>}

            <div className="simple-dialog-buttons">
                {currentLevelFinished && hasNextLevel
                    ? <button className="simple-dialog-button" onClick={triggerNextAction}>
                        <Icon icon="small-tick" iconSize={24}/>
                        <span>{getMessage('TASK_LEVEL_SUCCESS_NEXT_BUTTON')}</span>
                    </button>
                    : <button className="simple-dialog-button" onClick={props.onClose}>
                        <Icon icon="small-tick" iconSize={24}/>
                        <span>{getMessage('OK')}</span>
                    </button>
                }
            </div>
        </Dialog>
    );
}
