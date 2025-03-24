import {call} from 'typed-redux-saga';
import {asyncRequestJson} from '../../utils/api';
import {appSelect} from '../../hooks';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {getFormattedInstructionsForLevelSelector} from '../instructions/instructions';
import {TaskHint} from './hints_slice';
import React from 'react';
import {toHtml} from '../../utils/sanitize';

interface CodeHelpParameters {
    code: string,
    error: string,
    issue: string,
    taskInstructions?: string,
}

export function* getCodeHelpHint(parameters: CodeHelpParameters) {
    const codeHelpConfig = yield* appSelect(state => state.options.codeHelp);

    const loginBody = {
        username: codeHelpConfig.username,
        password: codeHelpConfig.password,
    };
    const loginPayload = (yield* call(asyncRequestJson, codeHelpConfig.url + '/api/login', loginBody, false)) as {access_token: string};
    const accessToken = loginPayload.access_token;

    const context = quickAlgoLibraries.getContext(null, 'main');
    const instructionsJQuery = yield* appSelect(state => getFormattedInstructionsForLevelSelector({state, context}));
    const instructionsText = instructionsJQuery.text();
    console.log({instructionsText});

    const queryBody = {
        code: parameters.code,
        error: parameters.error ?? '',
        issue: parameters.issue ?? '',
        // TODO: task instructions
    };

    const queryPayload = (yield* call(asyncRequestJson, codeHelpConfig.url + '/api/query', queryBody, false, {Authorization: `Bearer ${accessToken}`})) as {context: null, query_id: number, responses: {main: string, insufficient: string}};
    const {responses} = queryPayload;

    console.log({queryPayload})

    return {
        codeHelp: responses,
    };
}

export function formatCodeHelpHint(taskHint: TaskHint) {
    const formattedInsufficient = taskHint.codeHelp.insufficient?.replace(/`([^`]+)`/g, '<code>$1</code>');
    const formattedMain = taskHint.codeHelp.main.replace(/`([^`]+)`/g, '<code>$1</code>');

    return (
        <div className="codehelp-hint">
            {null !== formattedInsufficient && <p className="has-warning" dangerouslySetInnerHTML={toHtml(formattedInsufficient)}>
            </p>}
            <p dangerouslySetInnerHTML={toHtml(formattedMain)}>
            </p>
        </div>
    );
}
