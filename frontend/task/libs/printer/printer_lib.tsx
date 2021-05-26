import React from "react";
import {InputOutputVisualization} from "./InputOutputVisualization";
import {QuickAlgoLibrary} from "../quickalgo_librairies";
import {fork, put, select, take, takeEvery} from "redux-saga/effects";
import {AppStore} from "../../../store";
import {channel} from "redux-saga";
import {ActionTypes} from "../../../buffers/actionTypes";
import {ActionTypes as TaskActionTypes, TaskResetAction} from "../../index";
import {documentFromString} from "../../../buffers/document";
import {DocumentModel} from "../../../buffers";
import {updateCurrentTest} from "../../task_slice";
import {taskReset} from "../../index";

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

enum PrinterLibAction {
    readLine = 'readLine',
    getInput = 'getInput',
    printLine = 'printLine',
    reset = 'reset',
}

const inputBufferLib = 'printerLibInput';
const outputBufferLib = 'printerLibOutput';
const inputBufferLibTest = 'printerLibTestInput';

interface ExecutionChannelMessage {
    action: PrinterLibAction,
    payload?: any,
    resolve?: Function,
    reject?: Function,
}

const executionChannel = channel<ExecutionChannelMessage>();

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

export class PrinterLib extends QuickAlgoLibrary {
    success: boolean = false;
    taskInfos: any;
    cells: any;
    texts: any;
    scale: number;
    libOptions: any;
    showIfMutator: boolean;
    printer: any;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        const conceptBaseUrl = (window.location.protocol == 'https:' ? 'https:' : 'http:') + '//'
            + 'static4.castor-informatique.fr/help/printer.html';

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
        this.libOptions = infos.libOptions ? infos.libOptions : {};

        this.printer = {
            input_text: "",
            output_text: "",
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

    reset(taskInfos) {
        console.log('reset printer lib', taskInfos);
        this.success = false;

        this.printer.input_text = "";
        this.printer.output_text = "";

        if (taskInfos) {
            this.taskInfos = taskInfos;
        }
        if (this.taskInfos && this.taskInfos.input) {
            this.printer.input_text = this.taskInfos.input;
        }

        if (this.display) {
            executionChannel.put({
                action: PrinterLibAction.reset,
            });
        }
    };

    getCurrentState() {
        return {
            input: this.printer.input_text,
            output: this.printer.output_text,
        };
    };

    reloadState(data): void {
        const {input, output} = data;
        this.printer.input_text = input;
        this.printer.output_text = output;
    };

    resetDisplay() {

    };

    commonPrint(args, end) {
        return new Promise<null>((resolve, reject) => {
            executionChannel.put({
                action: PrinterLibAction.printLine,
                payload: {args, end},
                resolve,
                reject
            });
        });
    }

    async print() {
        await this.commonPrint(Array.prototype.slice.call(arguments, 0, -1), "\n");
        this.waitDelay(arguments[arguments.length-1]);
    }

    async print_end() {
        if(arguments.length > 1) {
            await this.commonPrint(Array.prototype.slice.call(arguments, 0, -2), arguments[arguments.length-2]);
            this.waitDelay(arguments[arguments.length-1]);
        } else {
            await this.commonPrint([], "\n");
            this.waitDelay(arguments[arguments.length-1]);
        }
    }

    commonRead(action: PrinterLibAction = PrinterLibAction.readLine) {
        return new Promise<string>((resolve, reject) => {
            executionChannel.put({action, resolve, reject});
        });
    }

    async read(callback) {
        const str = await this.commonRead();
        this.waitDelay(callback, str);
    }

    async readInteger(callback) {
        const result = await this.commonRead();
        this.waitDelay(callback, parseInt(result));
    }

    async readFloat(callback) {
        const result = await this.commonRead();
        this.waitDelay(callback, parseFloat(result));
    }

    async eof(callback) {
        const result = await this.commonRead(PrinterLibAction.getInput);
        this.waitDelay(callback, -1 === result.indexOf('\n'));
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

    checkOutputHelper() {
        const state = window.store.getState();
        const currentOutputText = state.buffers[outputBufferLib].model.document.toString();

        console.log('output', currentOutputText, this);
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
        return InputOutputVisualization;
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

    *executionChannelSaga(context) {
        while (true) {
            const {action, payload, resolve, reject} = yield take(executionChannel);
            const inputValue = context.printer.input_text;
            const outputValue = context.printer.output_text;

            switch (action) {
                case PrinterLibAction.getInput: {
                    resolve(this.printer.input_text);
                    break;
                }
                case PrinterLibAction.readLine: {
                    let result = "";
                    let index = inputValue.indexOf('\n');
                    if (index === -1) {
                        if (!inputValue) {
                            reject(context.strings.messages.inputEmpty);
                            continue;
                        }
                        result = inputValue;
                        context.printer.input_text = '';
                    } else {
                        result = inputValue.substring(0, index);
                        context.printer.input_text = inputValue.substring(index + 1);
                    }

                    if (context.display) {
                        const doc = documentFromString(context.printer.input_text);
                        yield put({
                            type: ActionTypes.BufferReset,
                            buffer: inputBufferLib,
                            model: new DocumentModel(doc)
                        });
                    }

                    resolve(result);
                    break;
                }
                case PrinterLibAction.reset: {
                    const currentTest = yield select((state: AppStore) => state.task.currentTest);
                    const inputTestDocument = documentFromString(currentTest.input);
                    yield put({
                        type: ActionTypes.BufferReset,
                        buffer: inputBufferLibTest,
                        model: new DocumentModel(inputTestDocument)
                    });

                    yield put({
                        type: ActionTypes.BufferReset,
                        buffer: inputBufferLib,
                        model: new DocumentModel(documentFromString(context.printer.input_text))
                    });
                    yield put({
                        type: ActionTypes.BufferReset,
                        buffer: outputBufferLib,
                        model: new DocumentModel(documentFromString(context.printer.output_text))
                    });
                    break;
                }
                case PrinterLibAction.printLine: {
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
                    for (let i=0; i < payload.args.length; i++) {
                        text += (i > 0 ? ' ' : '') + valueToStr(payload.args[i]);
                    }

                    context.printer.output_text = outputValue + text + payload.end;

                    if (context.display) {
                        const doc = documentFromString(context.printer.output_text);
                        yield put({
                            type: ActionTypes.BufferReset,
                            buffer: outputBufferLib,
                            model: new DocumentModel(doc)
                        });
                    }

                    resolve();
                    break;
                }
                default:
                    throw 'Unknown action';
            }
        }
    }

    *getSaga() {
        const context = this;
        yield fork(this.executionChannelSaga, this);

        yield takeEvery(ActionTypes.BufferEdit, function* (action) {
            // @ts-ignore
            const {buffer} = action;
            if (inputBufferLibTest !== buffer) {
                return;
            }

            const inputValue = yield select((state: AppStore) => state.buffers[inputBufferLibTest].model.document.toString());
            yield put(updateCurrentTest({input: inputValue}));
        });

        yield takeEvery(TaskActionTypes.TaskReset, function* (action: TaskResetAction) {
            const taskData = action.payload;
            if (!taskData.state) {
                return;
            }

            context.reloadState(taskData.state);
            console.log('reset task state', taskData);

            const inputDocument = documentFromString(context.printer.input_text);
            yield put({
                type: ActionTypes.BufferReset,
                buffer: inputBufferLib,
                model: new DocumentModel(inputDocument)
            });

            const outputDocument = documentFromString(context.printer.output_text);
            yield put({
                type: ActionTypes.BufferReset,
                buffer: outputBufferLib,
                model: new DocumentModel(outputDocument)
            });
        });
    }
}
