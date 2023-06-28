import {generateAvailableBlocksFromNotions, NotionsBag} from '../../blocks/notions';
import {BlockType} from '../../blocks/block_types';

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

const smartPyBlocksList = {
    'smart_contract': [{
        name: 'smartpy_smart_contract',
        type: BlockType.Token,
        caption: 'Smart contract',
        snippet: `import smartpy as sp

class \${1:name}(sp.Contract):
    def __init__(self, value):
        self.init(storage=value)

sp.add_compilation_target("default", \${1:name}())`,
    }],
    'entry_point': [{
        name: 'smartpy_entry_point',
        type: BlockType.Token,
        caption: 'Entry point',
        snippet: `@sp.entry_point
def make_call(self):
    `,
    }],
};

const archetypeBlocksList = {
    'smart_contract': [{
        name: 'archetype_smart_contract',
        type: BlockType.Token,
        caption: 'Smart contract',
        snippet: `archetype \${1:name}
        
variable store : \${2:type} = \${3:value}`,
    }],
    'entry_point': [{
        name: 'archetype_entry_point',
        type: BlockType.Token,
        caption: 'Entry point',
        snippet: `entry make_call () {
  
}`,
    }],
};

const cameLIGOBlocksList = {
    'smart_contract': [{
        name: 'cameligo_smart_contract',
        type: BlockType.Token,
        caption: 'Smart contract',
        snippet: `type storage = \${1:type}

type return = operation list * storage

let main (store : storage) : return =
  ([] : operation list)`,
    }],
};

const jsLIGOBlocksList = {
    'smart_contract': [{
        name: 'jsligo_smart_contract',
        type: BlockType.Token,
        caption: 'Smart contract',
        snippet: `type storage = \${1:type}

type return_ = [list<operation>, storage];

let main = ([store]: [storage]) : return_ => {
  return [
    list([]) as list<operation>
  ];
};`,
    }],
};

const michelsonBlocksList = {
    'smart_contract': [{
        name: 'michelson_smart_contract',
        type: BlockType.Token,
        caption: 'Smart contract',
        snippet: `storage \${1:type};
code
  {
    
  };`,
    }],
    'pairs': [{
        name: 'michelson_pairs_car',
        type: BlockType.Function,
        caption: 'CAR',
        snippet: `CAR;`,
    }, {
        name: 'michelson_pairs_nil',
        type: BlockType.Function,
        caption: 'NIL',
        snippet: `NIL operation;`,
    }, {
        name: 'michelson_pairs_car',
        type: BlockType.Function,
        caption: 'PAIR',
        snippet: `PAIR;`,
    }],
};

const smartContractsBlocksList = {
    [SmartContractPlatform.SmartPy]: smartPyBlocksList,
    [SmartContractPlatform.Archetype]: archetypeBlocksList,
    [SmartContractPlatform.Michelson]: michelsonBlocksList,
    [SmartContractPlatform.CameLIGO]: cameLIGOBlocksList,
    [SmartContractPlatform.JsLIGO]: jsLIGOBlocksList,
};

export function generateGetSmartContractSpecificBlocks(platform: SmartContractPlatform) {
    return function (notions: NotionsBag) {
        return generateAvailableBlocksFromNotions(notions, smartContractsBlocksList[platform]);
    };
}
