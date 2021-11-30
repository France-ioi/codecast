import React from "react";
import {useAppSelector} from "../hooks";
import {taskLevels, updateCurrentTestId} from "./task_slice";
import {useDispatch} from "react-redux";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {Spinner} from "@blueprintjs/core";
import {getMessage} from "../lang";

export function TaskTestsSelector() {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const currentSubmission = useAppSelector(state => state.task.currentSubmission);
    const levelData = currentTask.data[taskLevels[currentLevel]];

    const dispatch = useDispatch();

    const selectTest = (index) => {
        dispatch(updateCurrentTestId(index));
    }

    const existingImages = currentTask.gridInfos && currentTask.gridInfos.images ? currentTask.gridInfos.images.map(module => module.default) : [];

    const getTestThumbNail = (testIndex) => {
        const file = `test_${taskLevels[currentLevel]}_${testIndex + 1}`;
        const element = existingImages.find(image => image.indexOf(file + '.') !== -1);
        if (element) {
            return element;
        }

        // Lib usage behaviour: put images in html
        const levelTestImg = window.jQuery(`img#${file}`);
        if (levelTestImg.length) {
            return levelTestImg.attr('src');
        }

        return element ? element : null;
    };

    let testStatuses = null;
    if (currentSubmission) {
        testStatuses = levelData.map((test, index) => {
            // return 'executing';
            if (index in currentSubmission.results) {
                const testResult = currentSubmission.results[index];
                if (testResult.executing) {
                    return 'executing';
                }
                if (true === testResult.result) {
                    return 'success';
                }
                if (false === testResult.result) {
                    return 'failure';
                }
            }

            return 'unknown';
        })
    }

    return (
        <div className="tests-selector">
            {levelData.map((testData, index) =>
                <div
                    key={index}
                    className={`tests-selector-tab${currentTestId === index ? ' is-active' : ''}${testStatuses && testStatuses[index] ? ' status-' + testStatuses[index] : ''}`}
                    onClick={() => selectTest(index)}>
                    {getTestThumbNail(index) && <div className="test-thumbnail">
                        <img
                            src={getTestThumbNail(index)}
                        />
                    </div>}
                    <span className="test-title">
                        {testStatuses && <span className="test-icon">
                            {testStatuses[index] === 'executing' && <Spinner size={Spinner.SIZE_SMALL}/>}
                            {testStatuses && testStatuses[index] === 'success' && <FontAwesomeIcon icon={faCheckCircle}/>}
                            {testStatuses && testStatuses[index] === 'failure' && <FontAwesomeIcon icon={faTimesCircle}/>}
                        </span>}

                        <span>{getMessage('TESTS_TAB_TITLE').format({index: index + 1})}</span>
                    </span>
                </div>
            )}
        </div>
    );
}
