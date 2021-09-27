import React from "react";
import {InputOutputVisualization} from "./InputOutputVisualization";
import {QuickAlgoLibrary} from "../quickalgo_librairies";
import {call, fork, put, race, select, take, takeEvery} from "redux-saga/effects";
import {AppStore} from "../../../store";
import {channel} from "redux-saga";
import {ActionTypes} from "../../../buffers/actionTypes";
import {ActionTypes as StepperActionTypes} from "../../../stepper/actionTypes";
import {documentModelFromString} from "../../../buffers";
import {taskInputEntered, taskInputNeeded, updateCurrentTest} from "../../task_slice";
import {App} from "../../../index";
import {IoMode} from "../../../stepper/io";
import {ReplayContext} from "../../../player/sagas";

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function getTerminalText(events) {
    return events
        .map(event => event.content)
        .join("");
}

enum PrinterLibAction {
    readLine = 'readLine',
    getInput = 'getInput',
    printLine = 'printLine',
    reset = 'reset',
    syncBuffers = 'syncBuffers',
}

enum PrinterLineEventType {
    input = 'input',
    output = 'output',
}

interface PrinterLineEvent {
    type: PrinterLineEventType,
    content: string,
}

const inputBufferLib = 'printerLibInput';
const outputBufferLib = 'printerLibOutput';
export const inputBufferLibTest = 'printerLibTestInput';
export const outputBufferLibTest = 'printerLibTestOutput';

export enum PrinterLibActionTypes {
    PrinterLibTerminalInputKey = 'printerLib/terminalInputKey',
    PrinterLibTerminalInputBackSpace = 'printerLib/terminalInputBackSpace',
    PrinterLibTerminalInputEnter = 'printerLib/terminalInputEnter',
}

export const printerLibTerminalInputKey = (key: string) => ({
    type: PrinterLibActionTypes.PrinterLibTerminalInputKey,
    payload: key,
});

export const printerLibTerminalInputBackSpace = () => ({
    type: PrinterLibActionTypes.PrinterLibTerminalInputBackSpace,
});

export const printerLibTerminalInputEnter = () => ({
    type: PrinterLibActionTypes.PrinterLibTerminalInputEnter,
});

interface ExecutionChannelMessage {
    action: PrinterLibAction,
    payload?: any,
    resolve?: Function,
    reject?: Function,
}

const executionChannels = {
    main: channel<ExecutionChannelMessage>(),
    replay: channel<ExecutionChannelMessage>(),
};

const localLanguageStrings = {
    fr: {
        label: {
            print: "écrire",
            print_end: "écrire %1 en terminant par %2",
            read: "lire une ligne",
            readInteger: "lire un entier sur une ligne",
            readFloat: "lire un nombre à virgule sur une ligne",
            eof: "fin de la saisie"
        },
        code: {
            print: "print",
            print_end: "print_end",
            read: "input",
            readInteger: "lireEntier",
            readFloat: "lireDecimal",
            eof: "finSaisie"
        },
        description: {
            print: "print(texte) affiche le texte sur le terminal",
            read: "input() retourne une chaîne : la prochaine ligne de l'entrée"
        },
        startingBlockName: "Programme",
        messages: {
            inputPrompt: "Veuillez écrire une entrée pour le programme.",
            inputEmpty: "Votre programme a essayé de lire l'entrée alors qu'il n'y avait plus aucune ligne à lire !",
            outputWrong: "Votre programme n'a pas traité correctement toutes les lignes.",
            outputCorrect: "Bravo ! Votre programme a traité correctement toutes les lignes.",
            tooFewChars: "La ligne {0} de la sortie de votre programme est plus courte qu'attendue.",
            tooManyChars: "La ligne {0} de la sortie de votre programme est plus longue qu'attendue.",
            tooFewLines: "Trop peu de lignes en sortie",
            tooManyLines: "Trop de lignes en sortie",
            correctOutput: "La sortie est correcte !",
            moreThan100Moves: "La sortie est correcte, mais vous l'avez produite en plus de 100 étapes…"
        },
        errorStr: {
            intro: "La sortie de votre programme est fausse, à la ligne ",
            expected: " :<br>Attendu: \"<b>",
            answer: "</b>\",<br>Votre réponse: \"<b>",
            introChar: "</b>\".<br>(Premier caractère erroné à la colonne ",
            expectedChar: "; attendu: \"<b>",
            answerChar: "</b>\", votre réponse: \"<b>"
        }
    },
    de: {
        label: {
            print: "schreibe",
            print_end: "schreibe",
            read: "lies Zeile",
            readInteger: "lies Zeile als ganze Zahl",
            readFloat: "lies Zeile als Komma-Zahl",
            eof: "Ende der Eingabe",
            charToNumber: "Zeichen zu Zahl",
            numberToChar: "Zahl zu Zeichen",
            charToAscii: "ASCII-Zahl zu Zeichen",
            asciiToChar: "Zeichen zu ASCII-Zahl",
        },
        code: {
            print: "schreibe",
            print_end: "schreibe",
            read: "lies",
            readInteger: "liesGanzzahl",
            readFloat: "liesKommazahl",
            eof: "eingabeEnde",
            charToNumber: "zeichenZuZahl",
            numberToChar: "zahlZuZeichen",
            asciiToChar: "zeichenZuAscii",
            charToAscii: "asciiZuZeichen",
        },
        description: {
        },
        startingBlockName: "Programm",
        messages: {
            inputPrompt: "Please input a line for the program.", // TODO :: translate two lines
            inputEmpty: "Your program tried to read the input while there is no line left to read!",
            outputWrong: "Das Programm hat nicht alle Zeilen richtig ausgegeben.",
            outputCorrect: "Bravo! Das Programm hat alle Zeilen richtig ausgegeben.",
            tooFewChars: "Zeile zu kurz: Zeile {0}",
            tooManyChars: "Zeile zu lang: Zeile {0}",
            tooFewLines: "Zu wenig Zeilen ausgegeben",
            tooManyLines: "Zu viele Zeilen ausgegeben",
            correctOutput: "Die Ausgabe ist richtig!",
            moreThan100Moves: "Die Ausgabe ist richtig, aber du hast mehr als 100 Schritte benötigt …"
        },
        errorStr: {
            intro: "Das Programm hat nicht alle Zeilen richtig ausgegeben.; in Zeile ",
            expected: ":<br>Erwartet: \"<b>",
            answer: "</b>\",<br>deine Ausgabe: \"<b>",
            introChar: "</b>\".<br>(Erstes falsches Zeichen in Spalte ",
            expectedChar: "; erwartet: \"<b>",
            answerChar: "</b>\", deine Ausgabe: \"<b>"
        }
    },
    none: {
        comment: {
        }
    }
};

let recordApiInit = false;

export class PrinterLib extends QuickAlgoLibrary {
    success: boolean = false;
    taskInfos: any;
    cells: any;
    texts: any;
    scale: number;
    libOptions: any;
    showIfMutator: boolean;
    printer: any;
    ioMode: IoMode;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        const conceptBaseUrl = (window.location.protocol == 'https:' ? 'https:' : 'http:') + '//'
            + 'static4.castor-informatique.fr/help/printer_codecast.html';

        this.conceptList = [
            {
                id: 'printer_introduction',
                name: 'Les entrées/sorties',
                url: conceptBaseUrl + '#printer_introduction',
                isBase: true
            },
            {id: 'printer_print', name: 'Afficher une ligne', url: conceptBaseUrl + '#printer_print', isBase: true},
            {id: 'printer_read', name: 'Lire une ligne', url: conceptBaseUrl + '#printer_read', isBase: true}
        ];

        this.cells = [];
        this.texts = [];
        this.scale = 1;
        this.ioMode = null;
        this.libOptions = infos.libOptions ? infos.libOptions : {};

        this.printer = {
            ioEvents: [] as PrinterLineEvent[],
            initial: '',
            inputBuffer: '',
            terminal: null,
            commonPrint: this.commonPrint,
            print: this.print,
            print_end: this.print_end,
            commonRead: this.commonRead,
            read: this.read,
            readInteger: this.readInteger,
            readFloat: this.readFloat,
            eof: this.eof,
            charToAscii: this.charToAscii,
            asciiToChar: this.asciiToChar,
            charToNumber: this.charToNumber,
            numberToChar: this.numberToChar,
            inputKey: this.inputKey,
            inputBackSpace: this.inputBackSpace,
            inputEnter: this.inputEnter,
        };

        this.customBlocks = {
            printer: {
                print: [
                    // TODO : variants is not properly supported yet, once supported properly, print and print_end should be merged
                    { name: "print", params: [null], variants: [[null], [null, null]], anyArgs: true},
                    { name: "print_end", params: [null, null], variants: [[null], [null, null]], anyArgs: true, blocklyJson: {inputsInline: true}}
                ],
                read:  [
                    { name: "read", yieldsValue: true, blocklyJson: {output: "String"} },
                    { name: "readInteger", yieldsValue: true, blocklyJson: {output: "Number"} },
                    { name: "readFloat", yieldsValue: true, blocklyJson: {output: "Number"} },
                    { name: "eof", yieldsValue: true, blocklyJson: {output: "Boolean"}}
                ],
                manipulate: [
                    { name: "charToNumber", params: ["String"], yieldsValue: true, blocklyJson: {output: "Number"}},
                    { name: "numberToChar", params: ["Number"], yieldsValue: true, blocklyJson: {output: "String"}},
                    { name: "charToAscii",  params: ["String"], yieldsValue: true, blocklyJson: {output: "Number"}},
                    { name: "asciiToChar",  params: ["Number"], yieldsValue: true, blocklyJson: {output: "String"}}
                ]
            }
        };

        if (infos.showIfMutator) {
            this.showIfMutator = true;
        }
    }

    reset(taskInfos, appState: AppStore = null) {
        this.success = false;

        this.printer.ioEvents = [];

        if (taskInfos) {
            this.taskInfos = taskInfos;
        }
        if (this.taskInfos && this.taskInfos.input) {
            this.printer.initial = this.taskInfos.input;
        }
        if (appState && appState.ioPane.mode) {
            this.ioMode = appState.ioPane.mode;
        }

        if (this.display) {
            executionChannels.main.put({
                action: PrinterLibAction.reset,
            });
        }
    };

    getCurrentState() {
        return {
            events: this.printer.ioEvents,
            initial: this.printer.initial,
            inputBuffer: this.printer.inputBuffer,
        }
    };

    reloadState(data): void {
        console.log('RELOADED EVENTS', data);
        this.printer.ioEvents = data.events ?? [];
        this.printer.initial = data.initial;
        this.printer.inputBuffer = data.inputBuffer;
    };

    resetDisplay() {
        if (this.display) {
            console.log('make reset display');
            executionChannels.main.put({
                action: PrinterLibAction.syncBuffers,
            });
        }
    };

    getEventListeners(): {[eventName: string]: string} {
        return {
            [PrinterLibActionTypes.PrinterLibTerminalInputKey]: 'inputKey',
            [PrinterLibActionTypes.PrinterLibTerminalInputBackSpace]: 'inputBackSpace',
            [PrinterLibActionTypes.PrinterLibTerminalInputEnter]: 'inputEnter',
        };
    };

    inputKey(character) {
        console.log('received action inputKey', character);
        this.printer.inputBuffer = this.printer.inputBuffer + character;
    };

    inputBackSpace() {
        console.log('received action inputBackSpace');
        this.printer.inputBuffer = this.printer.inputBuffer.slice(0, -1);
    };

    *inputEnter() {
        const context = this;
        const inputValue = context.printer.inputBuffer;
        console.log('RECEIVE TERMINAL INPUT ENTER', inputValue);
        context.printer.inputBuffer = '';
        yield ['put', taskInputEntered({input: inputValue})];
    };

    *commonPrint(args, end) {
        const context = this;

        if (context.lost) {
            return;
        }

        // Fix display of arrays
        const valueToStr = function(value) {
            if (value && value.length !== undefined && typeof value == 'object') {
                let oldValue = value;
                value = [];
                for (let i=0; i < oldValue.length; i++) {
                    if (oldValue[i] && typeof oldValue[i].v != 'undefined') {
                        // When used inside Skulpt (Python mode)
                        value.push(oldValue[i].v);
                    } else {
                        value.push(oldValue[i]);
                    }
                    value[i] = valueToStr(value[i]);
                }
                return '[' + value.join(', ') + ']';
            } else if (value && value.isFloat && Math.floor(value) == value) {
                return value + '.0';
            } else if (value === true) {
                return 'True';
            } else if (value === false) {
                return 'False';
            }
            return value;
        }

        let text = '';
        for (let i=0; i < args.length; i++) {
            text += (i > 0 ? ' ' : '') + valueToStr(args[i]);
        }

        context.printer.ioEvents.push({type: PrinterLineEventType.output, content: text + end});
        console.log('PRINT', text);

        if (context.display) {
            console.log('has display');
            yield ['put', {
                type: ActionTypes.BufferReset,
                buffer: outputBufferLib,
                model: documentModelFromString(context.getOutputText()),
            }];
        }
    }

    *print() {
        console.log('PRINT', arguments);
        return yield* this.commonPrint(Array.prototype.slice.call(arguments, 0, -1), "\n");
    }

    *print_end() {
        if (arguments.length > 1) {
            return yield* this.commonPrint(Array.prototype.slice.call(arguments, 0, -2), arguments[arguments.length-2]);
        } else {
            return yield* this.commonPrint([], "\n");
        }
    }

    *commonRead(action: PrinterLibAction = PrinterLibAction.readLine) {
        const context = this;
        console.log('MAKE READ - BEFORE INTERACT', action, context.ioMode);

        let readResult = '';
        if (IoMode.Split === context.ioMode) {
            if (PrinterLibAction.getInput === action) {
                return context.getInputText();
            }

            let inputValue = context.getInputText();
            let index = inputValue.indexOf("\n");
            console.log('read split input', inputValue, index);
            if (index === -1) {
                if (!inputValue) {
                    throw context.strings.messages.inputEmpty;
                }
                readResult = inputValue;
                context.printer.initial = '';
            } else {
                readResult = inputValue.substring(0, index);
                console.log('READ', 'before', inputValue, 'after', inputValue.substring(index + 1));
                context.printer.initial = inputValue.substring(index + 1);
            }

            if (context.display) {
                console.log('now result, update', context.getInputText());
                yield ['put', {
                    type: ActionTypes.BufferReset,
                    buffer: inputBufferLib,
                    model: documentModelFromString(context.getInputText()),
                }];
            }

            return readResult;
        } else {
            let hasResult = false;
            let iterations = 0;
            while (!hasResult) {
                console.log('MAKE INTERACT', iterations);
                yield ['interact', 0 === iterations ? {saga : function* () {
                    console.log('MAKE READ - START INTERACT SAGA', context.display);
                    readResult = yield call(context.getInputSaga, context);
                    hasResult = true;
                    if (context.display) {
                        console.log('now result, update', context.getInputText());
                        yield put({
                            type: ActionTypes.BufferReset,
                            buffer: inputBufferLib,
                            model: documentModelFromString(context.getInputText()),
                        });
                    }
                }} : null];

                iterations++;
                if (iterations > 300) {
                    // Add a security break in case we've passed N events and not received input
                    console.error("We breaked out of printer lib input saga. This is an anormal behaviour.")
                    break;
                }
            }

            console.log('MAKE READ - AFTER INTERACT', readResult);

            return readResult;
        }
    }

    *read() {
        return yield* this.commonRead();
    }

    *readInteger() {
        const result = yield* this.commonRead();

        return parseInt(result);
    }

    *readFloat() {
        const result = yield* this.commonRead();

        return parseFloat(result);
    }

    *eof() {
        const result = yield* this.commonRead(PrinterLibAction.getInput);

        return -1 === result.indexOf('\n');
    }

    charToAscii(char, callback) {
        const number = char.charCodeAt(0);
        this.waitDelay(callback, number);
    }

    asciiToChar(number, callback) {
        const char = String.fromCharCode(number);
        this.waitDelay(callback, char);
    }

    charToNumber(char, callback) {
        const number = char.charCodeAt(0) - 65;
        this.waitDelay(callback, number);
    }
    numberToChar(number, callback) {
        const char = String.fromCharCode(number + 65);
        this.waitDelay(callback, char);
    }

    updateScale() {
        if (!this.display) {
            return;
        }
    };

    getInputText() {
        return this.printer.initial;
    }

    getOutputText() {
        return this.printer.ioEvents
            .filter(event => PrinterLineEventType.output === event.type)
            .map(event => event.content)
            .join("");
    };

    getTerminalText() {
        return getTerminalText(this.printer.ioEvents);
    };

    checkOutputHelper() {
        const currentOutputText = this.getOutputText();
        let expectedLines = this.taskInfos.output.replace(/\s*$/,"").split("\n");
        let actualLines = currentOutputText.replace(/\s*$/,"").split("\n");

        for (let iLine = 0; iLine < expectedLines.length && iLine < actualLines.length; iLine++) {
            let expectedLine = expectedLines[iLine].replace(/\s*$/,"");
            let actualLine = actualLines[iLine].replace(/\s*$/,"");

            let iChar = 0;
            for (iChar = 0; iChar < expectedLine.length && iChar < actualLine.length; iChar++) {
                if (actualLine[iChar] != expectedLine[iChar]) {
                    this.success = false;
                    let errorstring = (
                        this.strings.errorStr.intro
                        + (iLine + 1)
                        + this.strings.errorStr.expected
                        + escapeHtml(expectedLine)
                        + this.strings.errorStr.answer
                        + escapeHtml(actualLine)
                        + this.strings.errorStr.introChar
                        + (iChar + 1)
                        + this.strings.errorStr.expectedChar
                        + escapeHtml(expectedLine[iChar])
                        + this.strings.errorStr.answerChar
                        + escapeHtml(actualLine[iChar]) + '</b>"');
                    throw(errorstring); // add line info iLine + 1, add char info iChar + 1
                }
            }

            if (actualLine.length < expectedLine.length) {
                this.success = false;
                throw(this.strings.messages.tooFewChars.format(iLine + 1)); // add line info iLine + 1
            }

            if (actualLine.length > expectedLine.length) {
                this.success = false;
                throw(this.strings.messages.tooManyChars.format(iLine + 1)); // add line info iLine + 1
            }
        }

        if (actualLines.length < expectedLines.length) {
            this.success = false;
            throw(this.strings.messages.tooFewLines);
        }

        if (actualLines.length > expectedLines.length) {
            this.success = false;
            throw(this.strings.messages.tooManyLines);
        }
    }

    getComponent() {
        return this.display ? InputOutputVisualization : null;
    }

    provideBlocklyColours() {
        if ('bwinf' === this.infos.blocklyColourTheme) {
            return {
                categories: {
                    logic: 100,
                    loops: 180,
                    math: 230,
                    texts: 60,
                    lists: 40,
                    colour: 20,
                    variables: 330,
                    functions: 290,
                    read: 260,
                    print: 200,
                    manipulate: 0,
                    _default: 0
                },
                blocks: {}
            };
        }

        return super.provideBlocklyColours();
    }

    *getInputSaga(context) {
        console.log('HERE ASK INPUT');

        yield put(taskInputNeeded(true));

        const {input} = yield race({
            interrupt: take(StepperActionTypes.StepperInterrupt),
            exit: take(StepperActionTypes.StepperExit),
            input: take(taskInputEntered.type),
        });

        console.log('RECEIVED INPUT', input);

        if (input) {
            const inputValue = input.payload.input;

            context.printer.ioEvents.push({type: PrinterLineEventType.input, content: inputValue + "\n"});

            if (context.display) {
                yield call(context.syncInputOutputBuffers, context);
            }

            return inputValue;
        }

        return false;
    }

    *syncInputOutputBuffers(context) {
        yield put({
            type: ActionTypes.BufferReset,
            buffer: inputBufferLib,
            model: documentModelFromString(context.getInputText()),
        });

        yield put({
            type: ActionTypes.BufferReset,
            buffer: outputBufferLib,
            model: documentModelFromString(context.getOutputText()),
        });
    }

    *executionChannelSaga(context, replay) {
        try {
            console.log('create execution channel saga', replay);
            while (true) {
                const parameters = yield take(executionChannels[replay ? 'replay' : 'main']);
                yield fork(context.handleRequest, context, parameters);
            }
        } finally {
            console.log('close execution channel saga');
        }
    }

    *handleRequest(context, parameters) {
        const {action} = parameters;
        console.log('PRINTER HANDLE REQUEST', parameters);

        switch (action) {
            case PrinterLibAction.reset: {
                const currentTest = yield select((state: AppStore) => state.task.currentTest);
                yield put({
                    type: ActionTypes.BufferReset,
                    buffer: inputBufferLibTest,
                    model: documentModelFromString(currentTest.input),
                });

                yield put({
                    type: ActionTypes.BufferReset,
                    buffer: outputBufferLibTest,
                    model: documentModelFromString(currentTest.output),
                });

                yield call(context.syncInputOutputBuffers, context);
                break;
            }
            case PrinterLibAction.syncBuffers: {
                console.log('SYNC BUFFERS');
                yield call(context.syncInputOutputBuffers, context);
                break;
            }
            default:
                throw 'Unknown action';
        }
    }

    *getSaga(app: App) {
        console.log('START PRINTER LIB SAGA');
        yield fork(this.executionChannelSaga, this, app.replay);

        yield takeEvery(ActionTypes.BufferEdit, function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if (inputBufferLibTest === buffer) {
                const inputValue = yield select((state: AppStore) => state.buffers[inputBufferLibTest].model.document.toString());
                yield put(updateCurrentTest({input: inputValue}));
            }
            if (outputBufferLibTest === buffer) {
                const outputValue = yield select((state: AppStore) => state.buffers[outputBufferLibTest].model.document.toString());
                yield put(updateCurrentTest({output: outputValue}));
            }
        });

        if (!recordApiInit && !app.replay) {
            recordApiInit = true;

            app.replayApi.on('start', function* (replayContext: ReplayContext, event) {
                const {buffers} = event[2];
                let currentTest: {input?: string, output?: string} = {};
                if (buffers[inputBufferLibTest]) {
                    currentTest.input = buffers[inputBufferLibTest].document;
                }
                if (buffers[outputBufferLibTest]) {
                    currentTest.output = buffers[outputBufferLibTest].document;
                }
                if (Object.keys(currentTest).length) {
                    yield put(updateCurrentTest(currentTest));
                }
            });
        }
    }
}
