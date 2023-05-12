import React, {useState} from "react";
import {useAppSelector} from "../hooks";
import {useDispatch} from "react-redux";
import {Stars} from "./Stars";
import {getMessage} from "../lang";
import {levelScoringData} from "../submission/task_submission";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {taskChangeLevel} from "./index";
import {TaskLevelName} from "./platform/platform_slice";
import {Button, Dialog} from '@blueprintjs/core';

export function TaskLevelTabs() {
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const levels = useAppSelector(state => state.platform.levels);
    const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
    const [levelToChange, setLevelToChange] = useState<TaskLevelName>(null);

    const bypassLock = window.location.protocol === 'file:' || -1 !== ['localhost', '127.0.0.1', '0.0.0.0', 'lvh.me'].indexOf(window.location.hostname);

    const dispatch = useDispatch();

    const changeVersion = (level: TaskLevelName) => {
        if (levels[level].locked) {
            setLevelToChange(level);
            setLockedDialogOpen(true);
        } else {
            dispatch(taskChangeLevel(level));
        }
    };

    const doBypassLock = () => {
        dispatch(taskChangeLevel(levelToChange));
        closeLockedDialog();
    };

    const closeLockedDialog = () => {
        setLockedDialogOpen(false);
    };

    return (
        <nav className="level-tabs">
            {Object.values(levels).map((levelData, index) =>
                <div
                    key={levelData.level}
                    className={`level-tab ${currentLevel && levelData.level === currentLevel ? 'current' : ''}`}
                    role="tab"
                    tabIndex={-1}
                >
                    {index > 0 && <a
                        className="prev-link"
                        onClick={() => changeVersion(Object.keys(levels)[index - 1] as TaskLevelName)}
                    >
                        <FontAwesomeIcon icon={faChevronLeft}/>
                    </a>}
                    <a
                        className="level-tab-link"
                        onClick={() => changeVersion(levelData.level)}
                    >
                        <span>{getMessage('TASK_LEVEL')}</span>
                        <Stars
                            starsCount={levelScoringData[levelData.level].stars}
                            rating={levelData.score}
                            disabled={levelData.locked}
                        />
                    </a>
                    {index < Object.values(levels).length - 1 && <a
                        className="next-link"
                        onClick={() => changeVersion(Object.keys(levels)[index + 1] as TaskLevelName)}
                    >
                        <FontAwesomeIcon icon={faChevronRight}/>
                    </a>}
                </div>
            )}

            <Dialog
                isOpen={lockedDialogOpen}
                canOutsideClickClose={true}
                canEscapeKeyClose={true}
                onClose={closeLockedDialog}
                title={getMessage('TASK_LEVEL_LOCKED_TITLE')}
            >
                <div className='bp3-dialog-body'>
                    <p>{getMessage(bypassLock ? 'TASK_LEVEL_LOCKED_MESSAGE_DEV' : 'TASK_LEVEL_LOCKED_MESSAGE')}</p>

                    {bypassLock && <div className="has-text-centered">
                        <Button
                            className="quickalgo-button"
                            onClick={doBypassLock}
                        >
                            {getMessage('TASK_LEVEL_LOCKED_MESSAGE_DEV_BUTTON')}
                        </Button>
                    </div>}
                </div>
            </Dialog>
        </nav>
    );
}
