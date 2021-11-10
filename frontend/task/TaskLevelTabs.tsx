import React from "react";
import {useAppSelector} from "../hooks";
import {useDispatch} from "react-redux";
import Stars from "./Stars";
import {getMessage} from "../lang";
import {levelScoringData} from "./task_submission";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {taskChangeLevel} from "./index";

export function TaskLevelTabs() {
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const levels = useAppSelector(state => state.task.levels);

    const dispatch = useDispatch();

    const changeVersion = (level) => {
        dispatch(taskChangeLevel({level}));
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
                        onClick={() => changeVersion(Object.keys(levels)[index - 1])}
                    >
                        <FontAwesomeIcon icon={faChevronLeft}/>
                    </a>}
                    <a
                        className="level-tab-link"
                        onClick={() => changeVersion(levelData.level)}
                    >
                        <span>{getMessage('TASK_LEVEL')}</span>
                        <Stars starsCount={levelScoringData[levelData.level].stars} rating={levelData.score}/>
                    </a>
                    {index < Object.values(levels).length - 1 && <a
                        className="next-link"
                        onClick={() => changeVersion(Object.keys(levels)[index + 1])}
                    >
                        <FontAwesomeIcon icon={faChevronRight}/>
                    </a>}
                </div>
            )}
      </nav>
    );
}
