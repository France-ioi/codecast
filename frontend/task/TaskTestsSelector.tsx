import React from "react";
import {useAppSelector} from "../hooks";
import {updateCurrentTestId} from "./task_slice";
import {useDispatch} from "react-redux";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Spinner} from "@blueprintjs/core";
import {getMessage} from "../lang";
import {submissionChangePaneOpen} from '../submission/submission_slice';
import {faList} from '@fortawesome/free-solid-svg-icons/faList';
import {faChevronRight} from '@fortawesome/free-solid-svg-icons/faChevronRight';
import {faChevronLeft} from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import {memoize} from 'proxy-memoize';
import {ErrorCodeData, testErrorCodeData} from '../submission/TestsPaneListTest';
import {selectTaskTests} from '../submission/submission_selectors';
import {TaskTest} from './task_types';

const getTaskTestsByIndex = memoize((taskTests: TaskTest[]): {[key: number]: TaskTest} => {
    const getTaskTestsByIndex = {};
    for (let testIndex = 0; testIndex < taskTests.length; testIndex++) {
        getTaskTestsByIndex[testIndex] = taskTests[testIndex];
    }

    return getTaskTestsByIndex;
});

export function TaskTestsSelector() {
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const taskTests = useAppSelector(selectTaskTests);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const currentSubmission = useAppSelector(state => null !== state.submission.currentSubmissionId ? state.submission.taskSubmissions[state.submission.currentSubmissionId] : null);
    const submissionsPaneOpen = useAppSelector(state => state.submission.submissionsPaneOpen);
    const levelGridInfos = useAppSelector(state => state.task.levelGridInfos);

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

    const existingImages = levelGridInfos?.images ? levelGridInfos.images.map(element => element.path.default) : [];

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

    let testStatuses: ({executing: boolean, errorCodeData?: ErrorCodeData} | null)[] = [];
    if (currentSubmission) {
        testStatuses = taskTests.map((test, index) => {
            if (currentSubmission.result && currentSubmission.result.tests) {
                const testResult = currentSubmission.result.tests.find(testResult => testResult.testId === test.id);
                if (testResult) {
                    if (testResult.executing) {
                        return {executing: true};
                    }

                    const errorCodeData = testErrorCodeData[testResult.errorCode];

                    return {executing: false, errorCodeData};
                }
            }

            return null;
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
            {Object.entries(tooManyTests ? (null !== currentTestId ? {[currentTestId]: taskTestsByIndex[currentTestId]} : {}) : taskTestsByIndex).map(([index, testData]) =>
                <div
                    key={index}
                    className={`tests-selector-tab${!tooManyTests ? ' is-selectable' : ''}${currentTestId === Number(index) ? ' is-active' : ''}${testStatuses && testStatuses[index] ? ' status-' + testStatuses[index] : ''}`}
                    onClick={!tooManyTests ? () => selectTest(Number(index)) : () => {}}>
                    {getTestThumbNail(Number(index)) && <div className="test-thumbnail">
                        <img
                            src={getTestThumbNail(Number(index))}
                        />
                    </div>}
                    <span className={`test-title ${tooManyTests ? 'too-many-tests' : ''}`}>
                        {testStatuses[index] && <span className="test-icon">
                            {testStatuses[index].executing && <Spinner size={Spinner.SIZE_SMALL}/>}
                            {!testStatuses[index].executing && testStatuses[index].errorCodeData && <div className="submission-result-icon-container" style={{backgroundColor: testStatuses[index].errorCodeData.color}}>
                                <FontAwesomeIcon icon={testStatuses[index].errorCodeData.icon}/>
                            </div>}
                        </span>}

                        <span className="test-title-content">
                            {testData.name}
                        </span>

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
