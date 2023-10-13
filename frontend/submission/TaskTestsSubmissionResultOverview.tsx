import React from "react";
import {updateCurrentTestId} from "../task/task_slice";
import {useDispatch} from "react-redux";
import {ActionTypes} from "../stepper/actionTypes";
import {StepperStepMode} from "../stepper";
import {getMessage} from "../lang";
import {useAppSelector} from '../hooks';
import {selectTaskTests} from './submission_selectors';
import {TaskSubmissionResultPayload} from './submission_types';

export interface TaskTestsSubmissionResultOverviewProps {
    results: TaskSubmissionResultPayload[],
}

export function TaskTestsSubmissionResultOverview(props: TaskTestsSubmissionResultOverviewProps) {
    const dispatch = useDispatch();
    const tests = useAppSelector(selectTaskTests);

    const seeFailedTest = (testId) => {
        dispatch(updateCurrentTestId({testId}));
        dispatch({type: ActionTypes.StepperCompileAndStep, payload: {mode: StepperStepMode.Run, keepSubmission: true}});
    }

    return (
        <div className="test-results-overview">
            {props.results.map((testResult) =>
                <div
                    key={testResult.testId}
                    className="test-result"
                >
                    {true === testResult.result && <span className="test-success">{getMessage('TESTS_RESULT_OVERVIEW_SUCCESS').format({testName: tests[testResult.testId].name})}</span>}
                    {false === testResult.result && <React.Fragment>
                        <span className="test-error">{getMessage('TESTS_RESULT_OVERVIEW_FAILURE').format({testName: tests[testResult.testId].name})}</span>
                        <span className="test-link" onClick={() => seeFailedTest(testResult.testId)}>{getMessage('TESTS_RESULT_OVERVIEW_VIEW')}</span>
                    </React.Fragment>}
                </div>
            )}
        </div>
    );
}
