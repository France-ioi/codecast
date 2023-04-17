import {getPythonSpecificBlocks} from '../task/python_utils';
import {QuickalgoTaskIncludeBlocks} from '../task/task_slice';
import {Block} from '../task/blocks/blocks';
import {getCSpecificBlocks} from './views/c/utils';
import {getArchetypeSpecificBlocks} from './tezos';

export enum CodecastPlatform {
    Python = 'python',
    Unix = 'unix',
    Arduino = 'arduino',
    Blockly = 'blockly',
    Scratch = 'scratch',
    SmartPy = 'smartpy',
    Archetype = 'archetype',
    Michelson = 'michelson',
    CameLIGO = 'cameligo',
    JsLIGO = 'jsligo',
}

export interface PlatformData {
    needsCompilation?: boolean,
    hasMicroSteps?: boolean,
    aceSourceMode?: string,
    displayBlocks?: boolean,
    getSpecificBlocks?: (includeBlocks: QuickalgoTaskIncludeBlocks) => Block[],
}

export const platformsList: {[key in CodecastPlatform]: PlatformData} = {
    [CodecastPlatform.Python]: {aceSourceMode: 'python', displayBlocks: true, getSpecificBlocks: getPythonSpecificBlocks},
    [CodecastPlatform.Unix]: {needsCompilation: true, hasMicroSteps: true, aceSourceMode: 'c_cpp', getSpecificBlocks: getCSpecificBlocks},
    [CodecastPlatform.Arduino]: {needsCompilation: true, hasMicroSteps: true, aceSourceMode: 'arduino', getSpecificBlocks: getCSpecificBlocks},
    [CodecastPlatform.Blockly]: {aceSourceMode: 'text'},
    [CodecastPlatform.Scratch]: {aceSourceMode: 'text'},
    [CodecastPlatform.SmartPy]: {aceSourceMode: 'python'},
    [CodecastPlatform.Archetype]: {aceSourceMode: 'archetype', displayBlocks: true, getSpecificBlocks: getArchetypeSpecificBlocks},
    [CodecastPlatform.Michelson]: {aceSourceMode: 'michelson'},
    [CodecastPlatform.CameLIGO]: {aceSourceMode: 'ocaml'},
    [CodecastPlatform.JsLIGO]: {aceSourceMode: 'javascript'},
};
