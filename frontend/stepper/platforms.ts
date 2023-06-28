import {getPythonSpecificBlocks} from '../task/python_utils';
import {QuickalgoTaskIncludeBlocks} from '../task/task_types';
import {getCSpecificBlocks} from './views/c/utils';
import {NotionsBag} from '../task/blocks/notions';
import {smartContractPlatformsList} from '../task/libs/smart_contract/smart_contract_lib';
import {CodecastPlatform} from './codecast_platform';
import {Block} from '../task/blocks/block_types';

export interface PlatformData {
    needsCompilation?: boolean,
    hasMicroSteps?: boolean,
    aceSourceMode?: string,
    displayBlocks?: boolean,
    getSpecificBlocks?: (notionsBag: NotionsBag, includeBlocks?: QuickalgoTaskIncludeBlocks) => Block[],
}

export const platformsList: {[key: string]: PlatformData} = {
    [CodecastPlatform.Python]: {aceSourceMode: 'python', displayBlocks: true, getSpecificBlocks: getPythonSpecificBlocks},
    [CodecastPlatform.Unix]: {needsCompilation: true, hasMicroSteps: true, aceSourceMode: 'c_cpp', getSpecificBlocks: getCSpecificBlocks},
    [CodecastPlatform.Arduino]: {needsCompilation: true, hasMicroSteps: true, aceSourceMode: 'arduino', getSpecificBlocks: getCSpecificBlocks},
    [CodecastPlatform.Blockly]: {aceSourceMode: 'text'},
    [CodecastPlatform.Scratch]: {aceSourceMode: 'text'},
    ...smartContractPlatformsList,
};

export const hasBlockPlatform = (platform: CodecastPlatform) => {
    return CodecastPlatform.Blockly === platform || CodecastPlatform.Scratch === platform;
};
