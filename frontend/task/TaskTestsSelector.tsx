import React from "react";
import {useAppSelector} from "../hooks";
import {updateCurrentTestId} from "./task_slice";
import {useDispatch} from "react-redux";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle, faTimesCircle} from "@fortawesome/free-solid-svg-icons";
import {Spinner} from "@blueprintjs/core";
import {getMessage} from "../lang";
import {submissionChangePaneOpen} from '../submission/submission_slice';
import {faList} from '@fortawesome/free-solid-svg-icons/faList';

export function TaskTestsSelector() {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const taskTests = useAppSelector(state => state.task.taskTests);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const currentSubmission = useAppSelector(state => state.task.currentSubmission);
    const submissionsPaneOpen = useAppSelector(state => state.submission.submissionsPaneOpen);

    const dispatch = useDispatch();

    const selectTest = (index) => {
        dispatch(updateCurrentTestId({testId: index}));
    }

    const existingImages = currentTask.gridInfos && currentTask.gridInfos.images ? currentTask.gridInfos.images.map(element => element.path.default) : [];

    const getTestThumbNail = (testIndex) => {
        const file = `test_${currentLevel}_${testIndex + 1}`;
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
        testStatuses = taskTests.map((test, index) => {
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

    const toggleSubmissionPane = () => {
        dispatch(submissionChangePaneOpen(!submissionsPaneOpen));
    };

    return (
        <div className="tests-selector">
            <div
                className={`tests-selector-tab tests-selector-menu`}
                onClick={toggleSubmissionPane}>
                <span>
                    <FontAwesomeIcon icon={faList}/>
                </span>
            </div>
            {taskTests.map((testData, index) =>
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
