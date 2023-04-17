import {QuickalgoTask} from '../../task_slice';

export default {
    gridInfos: {
        context: 'printer',
        hideSaveOrLoad: true,
        conceptViewer: true,
        actionDelay: 200,
        includeBlocks: {
            generatedBlocks: {
                printer: {
                    easy: ["print"],
                    medium: ["print","read"],
                    hard: ["print","read"]
                }
            },
            standardBlocks: {
                includeAll: false,
                wholeCategories: {
                    easy: [],
                    medium: ["variables"],
                    hard: ["variables"]
                },
                singleBlocks: {
                    easy:["text"],
                    medium:["text", "math_arithmetic"],
                    hard:["text", "math_arithmetic", "controls_untilWhile"]
                },
            },
            variables: {
            }
        },
        maxInstructions: {easy:20, medium:30, hard: 100},
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
                output: "Hello world!\n"
            }
        ],
        medium: [
            {
                input: "Sophie\n",
                output: "Quel est votre nom ?\nBonjour Sophie\n"
            },
            {
                input: "Ahmed\n",
                output: "Quel est votre nom ?\nBonjour Ahmed\n"
            },
            {
                input: "Sarah\n",
                output: "Quel est votre nom ?\nBonjour Sarah\n"
            },
        ],
        hard: [
            {
                input: "Sophie\nAbracadabra\nhunter2\nSésame",
                output: "Quel est votre nom ?\nEntrez votre mot de passe :\nEssayez encore :\nEssayez encore :\nBonjour Sophie\n"
            },
            {
                input: "Ahmed\nMotDePasse\n123456789\nPassword\nSésame",
                output: "Quel est votre nom ?\nEntrez votre mot de passe :\nEssayez encore :\nEssayez encore :\nEssayez encore :\nBonjour Ahmed\n"
            },
        ],
    }
} as QuickalgoTask
