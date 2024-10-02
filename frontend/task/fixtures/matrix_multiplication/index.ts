import {QuickalgoTask} from '../../task_types';

export default {
    gridInfos: {
        context: 'printer',
        hideSaveOrLoad: true,
        conceptViewer: true,
        actionDelay: 200,
        maxIterWithoutAction: 5000,
        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                printer: ["print", "read"]
            },
            standardBlocks: {
                includeAll: false,
                wholeCategories: {
                    easy: ["variables"],
                    medium: ["variables"],
                    hard: ["variables"]
                },
                singleBlocks: ["text", "controls_repeat", "text_print", "text_print_noend", "text_join"]
            },
            variables: {},
            pythonAdditionalFunctions: []
        },
        maxInstructions: {easy: 40, medium: 40, hard: 100},
        checkEndEveryTurn: false,
        checkEndCondition: function (context, lastTurn) {
            if (!lastTurn) return;

            // throws, if something is wrong …
            context.checkOutputHelper();

            // Seems like everything is okay: Right number of lines and all lines match …
            context.success = true;
            throw(window.languageStrings.messages.outputCorrect);
        },
        computeGrade: function (context, message) {
            var rate = 0;
            if (context.success) {
                rate = 1;
                if (context.nbMoves > 100) {
                    rate /= 2;
                    message += window.languageStrings.messages.moreThan100Moves;
                }
            }
            return {
                successRate: rate,
                message: message
            };
        }
    },
    data: {
        easy: [
            {
                input: "",
                output: "0.000 -1.000\n1.000 0.000\n"
            }
        ],
        medium: [
            {
                input: "",
                output: "0.000 -1.000\n1.000 0.000\n"
            }
        ],
        hard: [
            {
                input: "",
                output: "0.000 -1.000\n1.000 0.000\n"
            }
        ],
    }
} as QuickalgoTask
