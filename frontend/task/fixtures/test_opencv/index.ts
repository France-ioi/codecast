import {QuickalgoTask} from '../../task_types';

export default {
    gridInfos: {
        context: 'opencv',
        hideSaveOrLoad: true,
        conceptViewer: true,
        actionDelay: 200,
        maxIterWithoutAction: 5000,
        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                opencv: ["imread", "cvtColor", "imwrite"]
            },
            standardBlocks: {
                includeAll: false,
                wholeCategories: {
                    easy: ["variables"],
                    medium: ["variables"],
                    hard: ["variables"]
                },
                singleBlocks: ["text", "logic_compare", "controls_if_else", "controls_repeat", "lists_repeat", "lists_getIndex", "lists_setIndex", "text_length", "text_join", "text_charAt"]
            },
            variables: {},
        },
        maxInstructions: {easy: 40, medium: 40, hard: 100},
        checkEndEveryTurn: false,
        // checkEndCondition: function (context, lastTurn) {
        //     if (!lastTurn) return;
        //
        //     // throws, if something is wrong …
        //     context.checkOutputHelper();
        //
        //     // Seems like everything is okay: Right number of lines and all lines match …
        //     context.success = true;
        //     throw(window.languageStrings.messages.outputCorrect);
        // },
        startingExample: {
            python: `from opencv import *
a = imread('original.png')`,
        }
    },
    data: {
        easy: [
            {},
        ],
    }
} as QuickalgoTask
