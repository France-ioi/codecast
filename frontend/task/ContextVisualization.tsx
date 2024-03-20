import React, {useEffect, useRef, useState} from "react";
import {QuickAlgoLibrariesActionType} from "./libs/quickalgo_libraries";
import {useAppSelector} from "../hooks";
import {useResizeDetector} from "react-resize-detector";
import {TaskTestsSelector} from "./TaskTestsSelector";
import {useDispatch} from "react-redux";
import {isTestPublic, TaskTestGroupType} from './task_types';
import {getMessage} from '../lang';
import {
    isServerSubmission
} from '../submission/submission';
import {submissionChangeDisplayedError, SubmissionErrorType} from '../submission/submission_slice';
import {Alert} from "react-bootstrap";
import {toHtml} from '../utils/sanitize';
import {nl2br} from '../common/utils';
import {Button} from '@blueprintjs/core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {
    selectSubmissionsPaneEnabled,
    selectTaskSelectorEnabled,
    selectTaskTests
} from '../submission/submission_selectors';
import {TaskSubmissionServerTestResult} from '../submission/submission_types';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';
import {TestResultVisualization} from '../submission/TestResultVisualization';

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const taskTests = useAppSelector(selectTaskTests);
    const taskState = useAppSelector(state => state.task.state);
    const taskLoaded = useAppSelector(state => state.task.loaded);
    const {width, height, ref} = useResizeDetector();
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const dispatch = useDispatch();
    const testsSelectorEnabled = useAppSelector(selectTaskSelectorEnabled);
    const submissionDisplayedError = useAppSelector(state => state.submission.submissionDisplayedError);

    const context = quickAlgoLibraries.getContext(null, 'main');
    const [hasNoFeedback, setHasNoFeedback] = useState(false);

    useEffect(() => {
        if (context) {
            dispatch({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
        }
    }, [taskLoaded]);

    useEffect(() => {
        if (context) {
            context.updateScale();
        }
    }, [width, height]);

    useEffect(() => {
        setHasNoFeedback(context && context.hasFeedback && !context.hasFeedback());
    }, [taskState]);

    const dismissSubmissionError = () => {
        dispatch(submissionChangeDisplayedError(null));
    };

    const showCompilationError = () => {
        dispatch(submissionChangeDisplayedError(SubmissionErrorType.CompilationError));
    };

    const currentTestPublic = null !== currentTestId && isTestPublic(taskTests[currentTestId]);

    const submission = useAppSelector(state => null !== state.submission.currentSubmissionId ? state.submission.taskSubmissions[state.submission.currentSubmissionId] : null);
    let currentTestResult: TaskSubmissionServerTestResult|null = null;
    if (null !== submission && null !== currentTestId && isServerSubmission(submission) && submission.result) {
        currentTestResult = submission.result.tests.find(test => test.testId === taskTests[currentTestId].id);
    }

    const createAlertVisualization = (content: any) => {
        return <div className="task-visualization-error"><Alert variant="danger" dismissible onClose={dismissSubmissionError}>
            <Alert.Heading>{getMessage('SUBMISSION_VIEW_ALERT_HEADER')}</Alert.Heading>
            <div className="error-content">{content}</div>
        </Alert></div>
    };

    let innerVisualization;
    if (submission && SubmissionErrorType.CompilationError === submissionDisplayedError && submission.result && submission.result.compilationError) {
        innerVisualization = createAlertVisualization(<div dangerouslySetInnerHTML={toHtml(submission.result.compilationMessage)}></div>);
    } else if (submission && SubmissionErrorType.CompilationWarning === submissionDisplayedError && submission.result && submission.result.compilationMessage) {
        innerVisualization = createAlertVisualization(submission.result.compilationMessage);
    } else if (submission && SubmissionErrorType.ExecutionError === submissionDisplayedError && submission.result && submission.result.errorMessage) {
        innerVisualization = createAlertVisualization(<div dangerouslySetInnerHTML={toHtml(nl2br(submission.result.errorMessage))}></div>);
    } else if (submission && !submission.evaluated && !submission.crashed && isServerSubmission(submission)) {
        innerVisualization = <div className="task-visualization-not-public">
            <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1"/>
            {getMessage('SUBMISSION_RESULTS_EVALUATING')}
        </div>;
    } else if (submission && submission.result && submission.result.compilationError) {
        innerVisualization = <div className="task-visualization-not-public">
            <div>
                <p>
                    {getMessage('SUBMISSION_VIEW_COMPILATION_ERROR')}
                </p>
                <p>
                    <Button
                        className="quickalgo-button"
                        onClick={showCompilationError}
                    >
                        {getMessage('SUBMISSION_VIEW_COMPILATION_ERROR_BUTTON')}
                    </Button>
                </p>
            </div>
        </div>;
    } else if (submission && submission.result && isServerSubmission(submission) && null !== currentTestId && !currentTestResult) {
        if (TaskTestGroupType.User === taskTests[currentTestId].groupType) {
            innerVisualization = <div className="task-visualization-not-public">
                {getMessage('TASK_VISUALIZATION_NOT_EVALUATED_USER')}
            </div>;
        } else {
            innerVisualization = <div className="task-visualization-not-public">
                {getMessage('TASK_VISUALIZATION_NOT_EVALUATED_EVALUATION')}
            </div>;
        }
    // } else if (currentTestResult && currentTestResult.noFeedback) {
    //     innerVisualization = <div className="task-visualization-not-public">
    //         {getMessage('TASK_VISUALIZATION_NO_FEEDBACK')}
    //     </div>;
    } else if (currentTestResult && hasNoFeedback) {
        innerVisualization = <TestResultVisualization
            testResult={currentTestResult}
        />;
    } else if (!currentTask || currentTestPublic || (currentTestResult && !currentTestResult.noFeedback)) {
        innerVisualization = <div className="task-visualization" ref={ref} style={{fontSize: `${zoomLevel}rem`}}>
            {Visualization ? <Visualization/> :
                <div id="taskContent">
                    <div id="taskIntro"/>
                    <div id="testSelector">
                        <div id="grid"/>
                    </div>
                </div>}
        </div>;
    } else {
        innerVisualization = <div className="task-visualization-not-public">
            {getMessage('TASK_VISUALIZATION_NOT_PUBLIC')}
        </div>
    }

    return (
        <div className="context-visualization cursor-main-zone" data-cursor-zone="context-visualization">
            <div className="task-visualization-container">
                {innerVisualization}
            </div>

            {testsSelectorEnabled && <TaskTestsSelector/>}
        </div>
    );
}
