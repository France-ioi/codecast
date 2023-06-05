import {QuickalgoTask} from '../../task_slice';

export default {
    gridInfos: {
        context: 'smart_contract',
        importModules: [],
        showLabels: true,
        conceptViewer: true,
        includeBlocks: {
            groupByCategory: true,
            standardBlocks: {
                wholeCategories: ['smart_contract_main_blocks', 'smart_contract_types'],
            },
        },
        expectedStorage: "(Pair (string %names) (nat %nb_calls))",
    },
} as QuickalgoTask
