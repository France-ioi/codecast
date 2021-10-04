import React from "react";
import {useAppSelector} from "../hooks";
import {taskLevels, updateCurrentTestId} from "./task_slice";
import {useDispatch} from "react-redux";

export function TaskTestsSelector() {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const levelData = currentTask.data[taskLevels[currentLevel]];

    const dispatch = useDispatch();
    const getMessage = useAppSelector(state => state.getMessage);

    const selectTest = (index) => {
        console.log('select test', index);
        dispatch(updateCurrentTestId(index));
    }

    const existingImages = currentTask.gridInfos.images.map(module => module.default);

    const getTestThumbNail = (testIndex) => {
        const file = `test_${taskLevels[currentLevel]}_${testIndex + 1}.`;
        const element = existingImages.find(image => image.indexOf(file) !== -1);

        return element ? element : null;
    };

    return (
        <div className="tests-selector">
            {levelData.map((testData, index) =>
                <div key={index} className={`tests-selector-tab ${currentTestId === index ? 'is-active' : ''}`} onClick={() => selectTest(index)}>
                    {getTestThumbNail(index) && <div className="test-thumbnail">
                        <img
                            src={getTestThumbNail(index)}
                        />
                    </div>}
                    <span className="test-title">
                        {false && <span className="testResultIcon">&nbsp;</span>}
                        {getMessage('TESTS_TAB_TITLE').format({index: index + 1})}
                    </span>
                </div>
            )}
        </div>
    );
}
