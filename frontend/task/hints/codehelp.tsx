import {call} from 'typed-redux-saga';
import {asyncRequestJson} from '../../utils/api';
import {appSelect} from '../../hooks';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {getFormattedInstructionsForLevelSelector} from '../instructions/instructions';
import {TaskHint} from './hints_slice';
import React from 'react';
import Markdown from 'react-markdown';

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
    return (
        <div className="codehelp-hint">
            {null !== taskHint.codeHelp.insufficient && <div className="has-warning mb-4">
                <Markdown>
                    {taskHint.codeHelp.insufficient}
                </Markdown>
            </div>}

            <Markdown>
                {taskHint.codeHelp.main}
            </Markdown>
        </div>
    );
}
