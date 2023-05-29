import React from "react";
import {InputOutputVisualization} from "./InputOutputVisualization";
import {QuickAlgoLibrary} from "../quickalgo_library";
import {apply, call, put, race, take, takeEvery} from "typed-redux-saga";
import {AppStore} from "../../../store";
import {ActionTypes as StepperActionTypes} from "../../../stepper/actionTypes";
import {
    taskInputEntered,
    taskInputNeeded,
} from "../../task_slice";
import {App} from "../../../index";
import {IoMode} from "../../../stepper/io";
import {delay} from "../../../player/sagas";
import {createDraft} from "immer";
import log from 'loglevel';
import {PayloadAction} from "@reduxjs/toolkit";
import {appSelect} from '../../../hooks';
import {TaskSubmissionServerTestResult, TestResultDiffLog} from '../../../submission/submission';
import {getMessage} from '../../../lang';
import {
    quickAlgoLibraries,
    QuickAlgoLibrariesActionType,
    quickAlgoLibraryResetAndReloadStateSaga
} from '../quickalgo_libraries';
import {CodecastPlatform} from '../../../stepper/platforms';
import {LibraryTestResult} from '../library_test_result';

export function getTerminalText(events) {
    return events
        .map(event => event.content)
        .join("");
}

enum PrinterLibAction {
    readLine = 'readLine',
    getInput = 'getInput',
    reset = 'reset',
}

enum PrinterLineEventType {
    input = 'input',
    output = 'output',
}

interface PrinterLineEvent {
    type: PrinterLineEventType,
    content: string,
}

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

interface PrinterLibInputPosition {
    event: number,
    pos: number,
}

export interface PrinterLibState {
    ioEvents: PrinterLineEvent[],
    initial: string,
    unknownInput?: boolean,
    expectedOutput: string,
    inputBuffer: string,
    inputPosition: PrinterLibInputPosition,
    errorHighlight?: any,
}

let printerLibInstance = 0;

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
    innerState: PrinterLibState;
    libInstance: number;

    constructor (display, infos) {
        super(display, infos);

        this.libInstance = printerLibInstance++;

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
            commonPrint: this.commonPrint,
            print: this.print,
            print_end: this.print_end,
            commonRead: this.commonRead,
            read: this.read,
            readInteger: this.readInteger,
            readFloat: this.readFloat,
            eof: this.eof,
            ungets: this.ungets,
            charToAscii: this.charToAscii,
            asciiToChar: this.asciiToChar,
            charToNumber: this.charToNumber,
            numberToChar: this.numberToChar,
            inputKey: this.inputKey,
            inputBackSpace: this.inputBackSpace,
            inputEnter: this.inputEnter,
        };

        this.innerState = {
            ioEvents: [] as PrinterLineEvent[],
            initial: '',
            expectedOutput: '',
            inputBuffer: '',
            inputPosition: createDraft({event: 0, pos: 0}),
            errorHighlight: null,
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

        this.innerState.ioEvents = [];
        this.innerState.inputBuffer = '';
        this.innerState.inputPosition = createDraft({event: 0, pos: 0});
        this.innerState.errorHighlight = null;

        if (taskInfos) {
            this.taskInfos = taskInfos;
        }
        if (this.taskInfos && this.taskInfos.input) {
            this.innerState.initial = this.taskInfos.input;
        }
        if (this.taskInfos && this.taskInfos.output) {
            this.innerState.expectedOutput = this.taskInfos.output;
        }
        if (appState && appState.options.ioMode) {
            this.ioMode = appState.options.ioMode;
        }
    };

    getSupportedPlatforms() {
        return [
            CodecastPlatform.Blockly,
            CodecastPlatform.Scratch,
            CodecastPlatform.Python,
            CodecastPlatform.Unix,
        ];
    };

    getInnerState() {
        return this.innerState;
    };

    implementsInnerState() {
        return true;
    }

    reloadInnerState(data): void {
        log.getLogger('printer_lib').debug('RELOADED EVENTS', data, data.initial, data.expectedOutput);
        this.innerState = data;
    };

    getEventListeners(): {[eventName: string]: string} {
        return {
            [PrinterLibActionTypes.PrinterLibTerminalInputKey]: 'inputKey',
            [PrinterLibActionTypes.PrinterLibTerminalInputBackSpace]: 'inputBackSpace',
            [PrinterLibActionTypes.PrinterLibTerminalInputEnter]: 'inputEnter',
        };
    };

    inputKey(character, callback) {
        log.getLogger('printer_lib').debug('received action inputKey', character, callback);
        this.innerState.inputBuffer = this.innerState.inputBuffer + character;
        callback();
    };

    inputBackSpace(callback) {
        log.getLogger('printer_lib').debug('received action inputBackSpace');
        this.innerState.inputBuffer = this.innerState.inputBuffer.slice(0, -1);
        callback();
    };

    *inputEnter() {
        const context = this;
        const inputValue = context.innerState.inputBuffer;
        log.getLogger('printer_lib').debug('RECEIVE TERMINAL INPUT ENTER', inputValue);
        context.innerState.inputBuffer = '';
        context.innerState.ioEvents.push({type: PrinterLineEventType.input, content: inputValue + "\n"});
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

        context.innerState.ioEvents.push({type: PrinterLineEventType.output, content: text + end});
        log.getLogger('printer_lib').debug('PRINT', text);
    }

    *print() {
        log.getLogger('printer_lib').debug('PRINT', arguments);
        return yield* this.commonPrint(Array.prototype.slice.call(arguments, 0, -1), "\n");
    }

    *print_end() {
        if (arguments.length > 1) {
            return yield* this.commonPrint(Array.prototype.slice.call(arguments, 0, -2), arguments[arguments.length-2]);
        } else {
            return yield* this.commonPrint([], "\n");
        }
    }

    getCurrentInputBuffer() {
        log.getLogger('printer_lib').debug('[printer_lib] check current input buffer', this.innerState.ioEvents.length, this.innerState.inputPosition);
        if (null !== this.innerState.inputPosition) {
            const {event, pos} = this.innerState.inputPosition;
            log.getLogger('printer_lib').debug('[printer_lib] check input position', event, pos);

            let remaining = '';
            let lastEventId = null;
            for (let eventId = event; eventId < this.innerState.ioEvents.length; eventId++) {
                const ioEvent = this.innerState.ioEvents[eventId];
                log.getLogger('printer_lib').debug('[printer_lib] check input', eventId, ioEvent, pos);
                if (PrinterLineEventType.input === ioEvent.type) {
                    remaining += this.innerState.ioEvents[eventId].content.substring(this.innerState.inputPosition.pos).trim();
                    log.getLogger('printer_lib').debug('[printer_lib] new remaining', remaining);
                    this.innerState.inputPosition.pos = 0;
                    lastEventId = eventId;
                }
            }

            if (null !== lastEventId) {
                this.innerState.inputPosition.event = lastEventId;
                this.innerState.inputPosition.pos = this.innerState.ioEvents[lastEventId].content.length;
                log.getLogger('printer_lib').debug('[printer_lib] reset position', this.innerState.inputPosition);
            }

            if (remaining.length) {
                return remaining;
            }
        }

        return null;
    }

    *commonRead(action: PrinterLibAction = PrinterLibAction.readLine) {
        const context = this;
        log.getLogger('printer_lib').debug('MAKE READ - BEFORE INTERACT', action, context.ioMode, context.innerState.inputPosition);

        const inputBuffer = this.getCurrentInputBuffer();
        if (null !== inputBuffer) {
            return inputBuffer;
        }

        let readResult = '';
        if (IoMode.Split === context.ioMode) {
            if (PrinterLibAction.getInput === action) {
                return context.getInputText();
            }

            let inputValue = context.getInputText();
            let index = inputValue.indexOf("\n");
            log.getLogger('printer_lib').debug('read split input', inputValue, index);
            if (index === -1) {
                if (!inputValue) {
                    throw context.strings.messages.inputEmpty;
                }
                readResult = inputValue;
                context.innerState.initial = '';
            } else {
                readResult = inputValue.substring(0, index);
                log.getLogger('printer_lib').debug('READ', 'before', inputValue, 'after', inputValue.substring(index + 1));
                context.innerState.initial = inputValue.substring(index + 1);
            }

            context.innerState.ioEvents.push({type: PrinterLineEventType.input, content: readResult + "\n"});
            context.innerState.inputPosition = createDraft({
                event: context.innerState.ioEvents.length - 1,
                pos: context.innerState.ioEvents[context.innerState.ioEvents.length - 1].content.length,
            });

            return readResult;
        } else {
            let hasResult = false;
            let iterations = 0;
            while (!hasResult) {
                log.getLogger('printer_lib').debug('MAKE INTERACT', iterations);
                yield ['interact', 0 === iterations ? {saga : function* () {
                    log.getLogger('printer_lib').debug('MAKE READ - START INTERACT SAGA', context.display);
                    readResult = (yield* apply(context, context.getInputSaga, [])) as string;
                    hasResult = true;
                }} : null];

                iterations++;
                if (iterations > 300) {
                    // Add a security break in case we've passed N events and not received input
                    console.error("We breaked out of printer lib input saga. This is an anormal behaviour.")
                    break;
                }
            }

            log.getLogger('printer_lib').debug('MAKE READ - AFTER INTERACT', readResult);

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

    *ungets(count) {
        let inputPosition = this.innerState.inputPosition;
        const startEvent = null !== inputPosition ? inputPosition.event : this.innerState.ioEvents.length - 1;

        log.getLogger('printer_lib').debug('[ungets] ', {inputPosition, startEvent, ioEvents: this.innerState.ioEvents});

        for (let eventId = startEvent; eventId >= 0; eventId--) {
            const event = this.innerState.ioEvents[eventId];
            if (event && PrinterLineEventType.input === event.type) {
                if (null === inputPosition) {
                    inputPosition = createDraft({event: eventId, pos: event.content.length});
                }

                inputPosition.pos -= count - 1;
                if (inputPosition.pos >= 0) {
                    break;
                }
            }
        }

        this.innerState.inputPosition = inputPosition;
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
        return this.innerState.initial;
    }

    getOutputText() {
        return PrinterLib.getOutputTextFromEvents(this.innerState.ioEvents);
    };

    static getOutputTextFromEvents(ioEvents: PrinterLineEvent[],) {
        return ioEvents
            .filter(event => PrinterLineEventType.output === event.type)
            .map(event => event.content)
            .join("");
    }

    checkOutputHelper() {
        const currentOutputText = this.getOutputText();
        let expectedLines = String(this.taskInfos.output).replace(/\s*$/,"").split("\n");
        let actualLines = currentOutputText.replace(/\s*$/,"").split("\n");

        for (let iLine = 0; iLine < expectedLines.length && iLine < actualLines.length; iLine++) {
            let expectedLine = expectedLines[iLine].replace(/\s*$/,"");
            let actualLine = actualLines[iLine].replace(/\s*$/,"");

            let iChar = 0;
            for (iChar = 0; iChar < expectedLine.length && iChar < actualLine.length; iChar++) {
                if (actualLine[iChar] != expectedLine[iChar]) {
                    this.success = false;

                    const log: TestResultDiffLog = {
                        remainingInput: this.getInputText(),
                        diffRow: iLine + 1,
                        diffCol: iChar + 1,
                        displayedExpectedOutput: this.taskInfos.output,
                        displayedSolutionOutput: currentOutputText,
                        excerptRow: 1,
                        excerptCol: 1,
                    };

                    throw(new LibraryTestResult(getMessage('IOPANE_ERROR').format({line: iLine + 1}), 'task-submission-test-result-diff', {
                        log,
                    }));
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

    *getInputSaga(): any {
        log.getLogger('printer_lib').debug('HERE ASK INPUT');

        yield* put(taskInputNeeded(true));

        const {input} = yield* race({
            exit: take(StepperActionTypes.StepperExit),
            input: take<PayloadAction<{input: string}>>(taskInputEntered.type),
        });

        log.getLogger('printer_lib').debug('RECEIVED INPUT', input);

        if (input) {
            const inputValue = input.payload.input;

            this.innerState.inputPosition = createDraft({
                event: this.innerState.ioEvents.length - 1,
                pos: this.innerState.ioEvents[this.innerState.ioEvents.length - 1].content.length,
            });

            return inputValue;
        }

        return false;
    }

    getErrorFromTestResult(testResult: TaskSubmissionServerTestResult): LibraryTestResult {
        try {
            // Check if first line of the log is JSON data containing a diff
            const log: TestResultDiffLog = JSON.parse(testResult.log.split(/\n\r|\r\n|\r|\n/).shift());

            return new LibraryTestResult(
                getMessage('IOPANE_ERROR').format({line: log.diffRow}),
                'task-submission-test-result-diff',
                {
                    log,
                }
            );
        } catch (e) {
            return LibraryTestResult.fromString(testResult.log);
        }
    }

    *getSaga(app: App) {
        log.getLogger('printer_lib').debug('START PRINTER LIB SAGA');

        yield* takeEvery(StepperActionTypes.StepperDisplayError, function* (action) {
            // @ts-ignore
            const {payload} = action;
            if (payload.error instanceof LibraryTestResult && 'task-submission-test-result-diff' === payload.error.getType()) {
                const log: TestResultDiffLog = payload.error.props.log;
                const environment = yield* appSelect(state => state.environment);
                const context = quickAlgoLibraries.getContext(null, environment);
                if (context) {
                    const errorHighlightRange = {
                        start: {
                            row: log.diffRow - 1,
                            column: log.diffCol - 1,
                        },
                        end: {
                            row: log.diffRow - 1,
                            column: log.diffCol,
                        },
                    };

                    const innerState: PrinterLibState = {
                        initial: log.remainingInput ? log.remainingInput : '',
                        unknownInput: undefined === log.remainingInput,
                        ioEvents: [
                            {type: PrinterLineEventType.output, content: log.displayedSolutionOutput},
                        ],
                        inputBuffer: '',
                        inputPosition: {event: 0, pos: 0},
                        expectedOutput: log.displayedExpectedOutput,
                        errorHighlight: errorHighlightRange,
                    };

                    yield* call(quickAlgoLibraryResetAndReloadStateSaga, app, innerState);
                    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
                }
            }
        });
    }
}
