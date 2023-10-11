import {generateAvailableBlocksFromNotions, NotionsBag} from '../../blocks/notions';
import {BlockType} from '../../blocks/block_types';

export enum SmartContractPlatform {
    SmartPy = 'smartpy', // SmartPy 0.18
    SmartPy019 = 'smartpy019', // SmartPy 0.18
    Archetype = 'archetype',
    Michelson = 'michelson',
    CameLIGO = 'mligo',
    JsLIGO = 'jsligo',
}

export const smartContractPlatforms = [
    SmartContractPlatform.SmartPy,
    SmartContractPlatform.SmartPy019,
    SmartContractPlatform.Archetype,
    SmartContractPlatform.Michelson,
    SmartContractPlatform.CameLIGO,
    SmartContractPlatform.JsLIGO,
];


export function generateGetSmartContractSpecificBlocks(platform: SmartContractPlatform) {
    return function (notions: NotionsBag) {
        return generateAvailableBlocksFromNotions(notions, window.SmartContractConfig.smartContractsBlocksList[platform]);
    };
}
