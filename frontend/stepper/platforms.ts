import {QuickalgoTaskIncludeBlocks} from '../task/task_types';
import {getCSpecificBlocks} from './views/c/utils';
import {NotionsBag} from '../task/blocks/notions';
import {smartContractPlatformsList} from '../task/libs/smart_contract/smart_contract_lib';
import {CodecastPlatform} from './codecast_platform';
import {Block} from '../task/blocks/block_types';
import {getPythonSpecificBlocks} from '../task/blocks/python_blocks';
import PythonRunner from './python/python_runner';
import AbstractRunner from './abstract_runner';
import UnixRunner from './c/unix_runner';
import BlocklyRunner from './js/blockly_runner';

export interface PlatformData {
    needsCompilation?: boolean,
    hasMicroSteps?: boolean,
    aceSourceMode?: string,
    displayBlocks?: boolean,
    extension?: string,
    getSpecificBlocks?: (notionsBag: NotionsBag, includeBlocks?: QuickalgoTaskIncludeBlocks) => Block[],
    runner?: typeof AbstractRunner,
}

const platformBundles = {
    // 'smartpy': [SmartContractPlatform.SmartPy, SmartContractPlatform.SmartPy019],
};

export function getAvailablePlatformsFromSupportedLanguages(supportedLanguages: string): string[] {
    const languages = supportedLanguages.split(',');
    const platforms = [];
    for (let language of languages) {
        if (language in platformBundles) {
            for (let platform of platformBundles[language]) {
                platforms.push(platform);
            }
        } else if (language in platformsList) {
            platforms.push(language);
        }
    }

    return platforms;
}

export const platformsList: {[key: string]: PlatformData} = {
    [CodecastPlatform.Python]: {
        aceSourceMode: 'python',
        displayBlocks: true,
        extension: 'py',
        runner: PythonRunner,
        getSpecificBlocks: getPythonSpecificBlocks,
    },
    [CodecastPlatform.C]: {
        needsCompilation: true,
        hasMicroSteps: true,
        extension: 'c',
        aceSourceMode: 'c_cpp',
        displayBlocks: true,
        runner: UnixRunner,
        getSpecificBlocks: getCSpecificBlocks,
    },
    [CodecastPlatform.Cpp]: {
        needsCompilation: true,
        hasMicroSteps: true,
        extension: 'cpp',
        aceSourceMode: 'c_cpp',
        displayBlocks: true,
        runner: UnixRunner,
        getSpecificBlocks: getCSpecificBlocks,
    },
    [CodecastPlatform.Java]: {
        needsCompilation: true,
        hasMicroSteps: true,
        extension: 'java',
        aceSourceMode: 'java',
    },
    [CodecastPlatform.Arduino]: {
        needsCompilation: true,
        hasMicroSteps: true,
        extension: 'cpp',
        aceSourceMode: 'arduino',
        runner: UnixRunner,
        getSpecificBlocks: getCSpecificBlocks,
    },
    [CodecastPlatform.Blockly]: {
        aceSourceMode: 'text',
        extension: 'blockly',
        runner: BlocklyRunner,
    },
    [CodecastPlatform.Scratch]: {
        aceSourceMode: 'text',
        extension: 'scratch',
        runner: BlocklyRunner,
    },
    ...smartContractPlatformsList,
};

export const hasBlockPlatform = (platform: CodecastPlatform) => {
    return CodecastPlatform.Blockly === platform || CodecastPlatform.Scratch === platform;
};
