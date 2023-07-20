import {generateAvailableBlocksFromNotions, NotionsBag} from '../../blocks/notions';

export enum SmartContractPlatform {
    SmartPy = 'smartpy',
    Archetype = 'archetype',
    Michelson = 'michelson',
    CameLIGO = 'mligo',
    JsLIGO = 'jsligo',
}

export const smartContractPlatforms = [
    SmartContractPlatform.SmartPy,
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
