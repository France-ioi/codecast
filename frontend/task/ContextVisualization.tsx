import React, {useEffect} from "react";
import {quickAlgoLibraries, QuickAlgoLibrariesActionType} from "./libs/quickalgo_libraries";
import {appSelect, useAppSelector} from "../hooks";
import {useResizeDetector} from "react-resize-detector";
import {TaskTestsSelector} from "./TaskTestsSelector";
import {useDispatch} from "react-redux";
import {isTestPublic} from './task_slice';
import {getMessage} from '../lang';
import {
    isServerSubmission,
    selectCurrentServerSubmission,
    TaskSubmissionServerTestResult
} from '../submission/submission';

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentTestId = useAppSelector(state => state.task.currentTestId);
    const taskTests = useAppSelector(state => state.task.taskTests);
    const taskLoaded = useAppSelector(state => state.task.loaded);
    const {width, height, ref} = useResizeDetector();
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const dispatch = useDispatch();

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

    let testsSelectorEnabled = false;
    if (currentTask && taskTests.length) {
        testsSelectorEnabled = 1 < taskTests.length && !currentTask.gridInfos.hiddenTests;
    }

    const currentTestPublic = null !== currentTestId && isTestPublic(currentTask, taskTests[currentTestId]);

    const submission = useAppSelector(selectCurrentServerSubmission);
    let currentTestResult: TaskSubmissionServerTestResult|null = null;
    if (null !== submission && null !== currentTestId && isServerSubmission(submission) && submission.result) {
        currentTestResult = submission.result.tests.find(test => test.testId === taskTests[currentTestId].id);
    }

    let innerVisualization = null;
    if (currentTestResult && currentTestResult.noFeedback) {
        innerVisualization = <div className="task-visualization-not-public">
            {getMessage('TASK_VISUALIZATION_NO_FEEDBACK')}
        </div>
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
