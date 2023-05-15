import React, {useEffect} from "react";
import {quickAlgoLibraries, QuickAlgoLibrariesActionType} from "./libs/quickalgo_libraries";
import {useAppSelector} from "../hooks";
import {useResizeDetector} from "react-resize-detector";
import {TaskTestsSelector} from "./TaskTestsSelector";
import {useDispatch} from "react-redux";
import {isTestPublic} from './task_slice';
import {getMessage} from '../lang';
import {
    isServerSubmission,
    selectSubmissionsPaneEnabled,
    TaskSubmissionServerTestResult
} from '../submission/submission';
import {submissionChangeDisplayedError, SubmissionErrorType} from '../submission/submission_slice';
import {Alert} from "react-bootstrap";
import {toHtml} from '../utils/sanitize';
import {nl2br} from '../common/utils';
import {Button} from '@blueprintjs/core';

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const taskTests = useAppSelector(state => state.task.taskTests);
    const taskLoaded = useAppSelector(state => state.task.loaded);
    const {width, height, ref} = useResizeDetector();
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const dispatch = useDispatch();
    const submissionPaneEnabled = useAppSelector(selectSubmissionsPaneEnabled);
    const submissionDisplayedError = useAppSelector(state => state.submission.submissionDisplayedError);

    const context = quickAlgoLibraries.getContext(null, 'main');

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

    const dismissSubmissionError = () => {
        dispatch(submissionChangeDisplayedError(null));
    };

    const showCompilationError = () => {
        dispatch(submissionChangeDisplayedError(SubmissionErrorType.CompilationError));
    };

    const testsSelectorEnabled = submissionPaneEnabled;
    const currentTestPublic = null !== currentTestId && isTestPublic(currentTask, taskTests[currentTestId]);

    const submission = useAppSelector(state => null !== state.submission.currentSubmissionId ? state.submission.taskSubmissions[state.submission.currentSubmissionId] : null);
    let currentTestResult: TaskSubmissionServerTestResult|null = null;
    if (null !== submission && null !== currentTestId && isServerSubmission(submission) && submission.result) {
        currentTestResult = submission.result.tests.find(test => test.testId === taskTests[currentTestId].id);
    }

    console.log('inner visuzalition', {submission, submissionDisplayedError});

    let innerVisualization = null;
    if (submission && SubmissionErrorType.CompilationError === submissionDisplayedError && submission.result && submission.result.compilationError) {
        innerVisualization = <div className="task-visualization-error"><Alert variant="danger" dismissible onClose={dismissSubmissionError}>
            <div className="error-content" dangerouslySetInnerHTML={toHtml(submission.result.compilationMessage)}></div>
        </Alert></div>;
    } else if (submission && SubmissionErrorType.CompilationWarning === submissionDisplayedError && submission.result && submission.result.compilationMessage) {
        innerVisualization = <div className="task-visualization-error"><Alert variant="danger" dismissible onClose={dismissSubmissionError}>
            <div className="error-content">
                {submission.result.compilationMessage}
            </div>
        </Alert></div>;
    } else if (submission && SubmissionErrorType.ExecutionError === submissionDisplayedError && submission.result && submission.result.errorMessage) {
        innerVisualization = <div className="task-visualization-error">
            <Alert variant="danger" dismissible onClose={dismissSubmissionError}>
                <div className="error-content" dangerouslySetInnerHTML={toHtml(nl2br(submission.result.errorMessage))}>
                </div>
            </Alert>
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
    } else if (currentTestResult && currentTestResult.noFeedback) {
        innerVisualization = <div className="task-visualization-not-public">
            {getMessage('TASK_VISUALIZATION_NO_FEEDBACK')}
        </div>;
    } else if (currentTestPublic || (currentTestResult && !currentTestResult.noFeedback)) {
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
        <div className="context-visualization">
            <div className="task-visualization-container">
                {innerVisualization}
            </div>

            {testsSelectorEnabled && <TaskTestsSelector/>}
        </div>
    );
}
