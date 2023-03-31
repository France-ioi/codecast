import React from "react";
import {getDiffHtmlFromLog, TestResultDiffLog} from './submission';
import {getMessage} from '../lang';
import {toHtml} from '../utils/sanitize';

export interface TestResultDiffProps {
    log: TestResultDiffLog,
}

export function SubmissionTestResultDiff(props: TestResultDiffProps) {
    const diff = props.log;

    const {resSol, resExp} = getDiffHtmlFromLog(diff);

    return (
        <div className="submission-test-result-diff">
            <p>{getMessage('SUBMISSION_RESULT_OUTPUT_PROGRAM')}</p>
            <pre dangerouslySetInnerHTML={toHtml(resSol)}></pre>
            <p>{getMessage('SUBMISSION_RESULT_OUTPUT_EXPECTED')}</p>
            <pre dangerouslySetInnerHTML={toHtml(resExp)}></pre>
            <p dangerouslySetInnerHTML={toHtml(getMessage('SUBMISSION_RESULT_OUTPUT_HELP'))}></p>
        </div>
    );
}
