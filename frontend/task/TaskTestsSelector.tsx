import React from "react";
import {useAppSelector} from "../hooks";
import {TaskTest, updateCurrentTestId} from "./task_slice";
import {useDispatch} from "react-redux";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Spinner} from "@blueprintjs/core";
import {getMessage} from "../lang";
import {submissionChangePaneOpen} from '../submission/submission_slice';
import {faList} from '@fortawesome/free-solid-svg-icons/faList';
import {faChevronRight} from '@fortawesome/free-solid-svg-icons/faChevronRight';
import {faChevronLeft} from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import {faCheckCircle} from '@fortawesome/free-solid-svg-icons/faCheckCircle';
import {faTimesCircle} from '@fortawesome/free-solid-svg-icons/faTimesCircle';
import {memoize} from 'proxy-memoize';
import {SubmissionTestErrorCode} from '../submission/task_platform';

const getTaskTestsByIndex = memoize((taskTests: TaskTest[]): {[key: number]: TaskTest} => {
    const getTaskTestsByIndex = {};
    for (let testIndex = 0; testIndex < taskTests.length; testIndex++) {
        getTaskTestsByIndex[testIndex] = taskTests[testIndex];
    }

    return getTaskTestsByIndex;
});

export function TaskTestsSelector() {
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const taskTests = useAppSelector(state => state.task.taskTests);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const currentSubmission = useAppSelector(state => null !== state.submission.currentSubmissionId ? state.submission.taskSubmissions[state.submission.currentSubmissionId] : null);
    const submissionsPaneOpen = useAppSelector(state => state.submission.submissionsPaneOpen);

    const dispatch = useDispatch();

    const selectTest = (index) => {
        dispatch(updateCurrentTestId({testId: index}));
    };

    const incrementTestId = (increment) => {
        const newTestId = currentTestId + increment;
        if (newTestId >= 0 && newTestId <= taskTests.length - 1) {
            selectTest(newTestId);
        }
    };

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
            if (index in currentSubmission.result.tests) {
                const testResult = currentSubmission.result.tests[index];
                if (testResult.executing) {
                    return 'executing';
                }
                if (SubmissionTestErrorCode.NoError === testResult.errorCode) {
                    return 'success';
                }

                return 'failure';
            }

            return 'unknown';
        })
    }

    const taskTestsByIndex = getTaskTestsByIndex(taskTests);

    const toggleSubmissionPane = () => {
        dispatch(submissionChangePaneOpen(!submissionsPaneOpen));
    };

    const tooManyTests = taskTests.length > 3;

    return (
        <div className="tests-selector">
            <div
                className={`tests-selector-tab tests-selector-menu`}
                onClick={toggleSubmissionPane}>
                <span>
                    <FontAwesomeIcon icon={faList}/>
                </span>
            </div>
            {Object.entries(tooManyTests ? {[currentTestId]: taskTestsByIndex[currentTestId]} : taskTestsByIndex).map(([index, testData]) =>
                <div
                    key={index}
                    className={`tests-selector-tab${currentTestId === Number(index) ? ' is-active' : ''}${testStatuses && testStatuses[index] ? ' status-' + testStatuses[index] : ''}`}
                    onClick={() => selectTest(Number(index))}>
                    {getTestThumbNail(Number(index)) && <div className="test-thumbnail">
                        <img
                            src={getTestThumbNail(Number(index))}
                        />
                    </div>}
                    <span className={`test-title ${tooManyTests ? 'too-many-tests' : ''}`}>
                        {testStatuses && <span className="test-icon">
                            {testStatuses[index] === 'executing' && <Spinner size={Spinner.SIZE_SMALL}/>}
                            {testStatuses && testStatuses[index] === 'success' && <FontAwesomeIcon icon={faCheckCircle}/>}
                            {testStatuses && testStatuses[index] === 'failure' && <FontAwesomeIcon icon={faTimesCircle}/>}
                        </span>}

                        <span className="test-title-content">{getMessage('TESTS_TAB_TITLE').format({index: Number(index) + 1})}</span>

                        {tooManyTests && <span className="test-index">
                            {Number(index) + 1}/{taskTests.length}
                        </span>}
                    </span>
                </div>
            )}
            {tooManyTests && <React.Fragment>
                <div
                    className={`tests-selector-tab tests-selector-menu ${currentTestId <= 0 ? 'is-disabled' : ''}`}
                    onClick={() => incrementTestId(-1)}>
                    <span>
                        <FontAwesomeIcon icon={faChevronLeft}/>
                    </span>
                </div>
                <div
                    className={`tests-selector-tab tests-selector-menu ${currentTestId >= taskTests.length - 1 ? 'is-disabled' : ''}`}
                    onClick={() => incrementTestId(1)}>
                    <span>
                        <FontAwesomeIcon icon={faChevronRight}/>
                    </span>
                </div>
            </React.Fragment>}
        </div>
    );
}
