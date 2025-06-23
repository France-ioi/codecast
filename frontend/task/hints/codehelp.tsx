import {call} from 'typed-redux-saga';
import {asyncRequestJson} from '../../utils/api';
import {appSelect} from '../../hooks';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {getFormattedInstructionsForLevelSelector} from '../instructions/instructions';
import {TaskHint} from './hints_slice';
import React from 'react';
import Markdown from 'react-markdown';
import {getMessage} from '../../lang';
import {selectActiveBufferPlatform} from '../../buffers/buffer_selectors';
import {getContextBlocksDataSelector} from '../blocks/blocks';
import {Block, BlockType} from '../blocks/block_types';
import {platformsList} from '../../stepper/platforms';
import {selectTaskTokenPayload} from '../platform/platform';

interface CodeHelpParameters {
    code: string,
    error: string,
    issue: string,
    taskInstructions?: string,
}

export function* getCodeHelpHint(parameters: CodeHelpParameters): Generator<any, TaskHint> {
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
    const platform = yield* appSelect(selectActiveBufferPlatform);

    const decodedTaskToken = yield* appSelect(selectTaskTokenPayload);

    const allBlocks = yield* appSelect(state => getContextBlocksDataSelector({state, context}));
    const filteredBlocks = allBlocks.filter(block => BlockType.Directive !== block.type);

    const blocksByLib: Record<string, Block[]> = {};
    for (let block of filteredBlocks) {
        if (!block.generatorName) {
            continue;
        }
        if (!(block.generatorName in blocksByLib)) {
            blocksByLib[block.generatorName] = [];
        }
        blocksByLib[block.generatorName].push(block);
    }

    const libraryDefinitions = [];
    for (let [libraryName, blocks] of Object.entries(blocksByLib)) {
        libraryDefinitions.push(`${getMessage('HINTS_CODE_HELP_LIB_DEFINITION').format({library: libraryName})}
            ${blocks.map(block => `- ${block.caption} : ${block.description}`).join("\n")}`);
    }

    const queryBody = {
        code: parameters.code,
        error: parameters.error ?? '',
        issue: parameters.issue ?? '',
        task_instructions: {
            tools: platformsList[platform].name,
            details: `${instructionsText}\n\n${libraryDefinitions.join("\n")}`,
            // "avoid": "loops\r\nfor\r\nwhile",
            name: quickAlgoLibraries.getMainContextName('main'),
        },
        user_id: decodedTaskToken?.idUser,
    };

    const queryPayload = (yield* call(asyncRequestJson, codeHelpConfig.url + '/api/query', queryBody, false, {Authorization: `Bearer ${accessToken}`})) as {context: null, query_id: number, responses: {main: string, insufficient: string}};
    const {responses} = queryPayload;

    return {
        codeHelp: {
            ...responses,
            issue: parameters.issue,
        },
    };
}

export function formatCodeHelpHint(taskHint: TaskHint) {
    return (
        <div className="codehelp-hint">
            {!!taskHint.codeHelp.insufficient && <div className="has-warning mb-4">
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
