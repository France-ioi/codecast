import React from "react";
import {LayoutIOPane} from "../layout/LayoutIOPane";
import {QuickAlgoLibrary} from "./quickalgo_librairies";

// Printer lib version 3 : React-way

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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
    firstLineHighlight: any;
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
        this.firstLineHighlight = null;
        this.libOptions = infos.libOptions ? infos.libOptions : {};

        this.printer = {
            input_text: "",
            output_text: "",
            input_reset: true,
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
        this.success = false;
        if (this.display) {
            this.resetDisplay();
        } else {
            // resetItems();
        }

        this.printer.output_text = "";
        this.printer.input_text = "";
        this.printer.input_reset = true;

        if (taskInfos) {
            this.taskInfos = taskInfos;
        }
        if (this.taskInfos && this.taskInfos.input) {
            this.printer.input_text = this.taskInfos.input;
        }
        this.updateScale();
    };

    getCurrentState() {
        return {
            input_text: this.printer.input_text,
            output_text: this.printer.output_text,
            input_reset: this.printer.input_reset,
        };
    };

    reloadState(data): void {
        this.printer.input_text = data.input_text;
        this.printer.output_text = data.output_text;
        this.printer.input_reset = data.input_reset;
        this.updateScale();
    };

    resetDisplay() {
        // this.delayFactory.destroyAll();

        $("#grid").html(
            '<div style="width: 400px; margin: 0; padding: 0; overflow: hidden; text-align: left;">' +
            '  <div style="width: 175px; height: 200px; padding: 5px; margin: 5px; border: 1px solid black; overflow-y: auto; float: right;">' +
            '    <div style="font-size:small">Output:</div>' +
            '    <pre id="output" style="margin:0px;">a</pre>' +
            '  </div>' +
            '  <div style="width: 175px; height: 200px; padding: 5px; margin: 5px; border: 1px solid black; overflow-y: auto; float: right;">' +
            '    <div style="font-size:small">Input:</div>' +
            (this.libOptions.highlightRead ? '    <pre id="inputHighlight" style="margin: 0px; background-color: lightgray; border-bottom: 1px solid black;"></pre>' : '') +
            '    <pre id="input" style="margin: 0px;">a</pre>' +
            '  </div>' +
            '</div>')

        $("#output").html("");
        $("#input").html("");
        $("#inputHighlight").html("");
        this.firstLineHighlight = null;

        // this.blocklyHelper.updateSize();
        this.updateScale();
    };

    commonPrint(args, end, callback) {
        if (this.lost) {
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

        this.printer.output_text += text + end;
        this.updateScale();
        this.waitDelay(callback);
    }

    print() {
        this.commonPrint(Array.prototype.slice.call(arguments, 0, -1), "\n", arguments[arguments.length-1]);
    }

    print_end() {
        if(arguments.length > 1) {
            this.commonPrint(Array.prototype.slice.call(arguments, 0, -2), arguments[arguments.length-2], arguments[arguments.length-1]);
        } else {
            this.commonPrint([], "\n", arguments[arguments.length-1]);
        }
    }

    commonRead() {
        let result;

        if(this.taskInfos.freeInput && this.display) {
            if(this.printer.input_reset) {
                // First read, reset input display
                this.printer.input_text = '';
                this.printer.input_reset = false;
            }
            result = window.prompt(this.strings.messages.inputPrompt);
            this.printer.input_text += result + '\n';
        } else {
            // This test has a predefined input
            result = "";
            let index = this.printer.input_text.indexOf('\n');

            if (index < 0) {
                if(!this.printer.input_text) {
                    throw this.strings.messages.inputEmpty;
                }
                result = this.printer.input_text;
                this.printer.input_text = "";
            }
            else {
                result = this.printer.input_text.substring(0,index);
                this.printer.input_text = this.printer.input_text.substring(index+1);
            }
        }

        if (this.libOptions.highlightRead) {
            this.firstLineHighlight = result;
        }

        this.updateScale();

        return result;
    }

    read(callback) {
        const str = this.commonRead();

        this.waitDelay(callback, str);
    }


    readInteger(callback) {
        const num = parseInt(this.commonRead());

        this.waitDelay(callback, num);
    }

    readFloat(callback) {
        const num = parseFloat(this.commonRead());

        this.waitDelay(callback, num);
    }

    eof(callback) {
        let index = this.printer.input_text.indexOf('\n');

        if (index < 0) {
            this.waitDelay(callback, true);
        }

        this.waitDelay(callback, false);
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

        // Codecast.store.dispatch({type: ActionTypes.BufferReset, buffer: 'printer-input', model: this.printer.input_text});
        // Codecast.store.dispatch({type: ActionTypes.BufferReset, buffer: 'printer-output', model: this.printer.output_text});
        $("#output").text(this.printer.output_text);
        $("#input").text(this.printer.input_text);
        $("#inputHighlight").text(this.firstLineHighlight ? this.firstLineHighlight : '');
    };

    checkOutputHelper() {
        let expectedLines = this.taskInfos.output.replace(/\s*$/,"").split("\n");
        let actualLines = this.printer.output_text.replace(/\s*$/,"").split("\n");

        let iLine = 0;

        for (iLine = 0; iLine < expectedLines.length && iLine < actualLines.length; iLine++) {
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
        return LayoutIOPane;
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
}
