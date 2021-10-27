import React from "react";
import {TaskSubmissionResultPayload, updateCurrentTestId} from "./task_slice";
import {useAppSelector} from "../hooks";
import {useDispatch} from "react-redux";
import {ActionTypes} from "../stepper/actionTypes";
import {StepperStepMode} from "../stepper";
import {getMessage} from "../lang";

export interface TaskTestsSubmissionResultOverviewProps {
    results: TaskSubmissionResultPayload[],
}

export function TaskTestsSubmissionResultOverview(props: TaskTestsSubmissionResultOverviewProps) {
    const dispatch = useDispatch();

    const seeFailedTest = (testId) => {
        dispatch(updateCurrentTestId(testId));
        dispatch({type: ActionTypes.StepperCompileAndStep, payload: {mode: StepperStepMode.Run, keepSubmission: true}});
    }

    return (
        <div className="test-results-overview">
            {props.results.map((testResult) =>
                <div
                    key={testResult.testId}
                    className="test-result"
                >
                    {true === testResult.result && <span className="test-success">{getMessage('TESTS_RESULT_OVERVIEW_SUCCESS').format({index: testResult.testId + 1})}</span>}
                    {false === testResult.result && <React.Fragment>
                        <span className="test-error">{getMessage('TESTS_RESULT_OVERVIEW_FAILURE').format({index: testResult.testId + 1})}</span>
                        <span className="test-link" onClick={() => seeFailedTest(testResult.testId)}>{getMessage('TESTS_RESULT_OVERVIEW_VIEW')}</span>
                    </React.Fragment>}
                </div>
            )}
        </div>
    );
}
