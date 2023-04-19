import {QuickAlgoLibrary} from "../quickalgo_library";
import {call, put, takeEvery} from "typed-redux-saga";
import {AppStore} from "../../../store";
import {ActionTypes as StepperActionTypes, stepperDisplayError} from "../../../stepper/actionTypes";
import {App} from "../../../index";
import {IoMode} from "../../../stepper/io";
import log from 'loglevel';
import {SmartContractView} from './SmartContractView';
import {
    TaskSubmissionServerTestResult,
    TaskSubmissionTestResult,
    TestResultDiffLog
} from '../../../submission/submission';
import {appSelect} from '../../../hooks';
import {
    quickAlgoLibraries,
    QuickAlgoLibrariesActionType,
    quickAlgoLibraryResetAndReloadStateSaga
} from '../quickalgo_libraries';

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

export interface SmartContractResultLogLine {
    amount: number,
    as: string,
    command: string,
    date: string,
    failed?: boolean,
    kind: string,
    source: string,
    stderr?: string,
    stdout?: string,
    storage: any,
}

interface SmartContractLibState {
    resultLog?: SmartContractResultLogLine[]
}

export class SmartContractLib extends QuickAlgoLibrary {
    innerState: SmartContractLibState;

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

        this.innerState = {};
    }

    reset(taskInfos, appState: AppStore = null) {
        this.success = false;
    };

    getInnerState() {
        return this.innerState;
    };

    implementsInnerState() {
        return true;
    }

    reloadInnerState(data): void {
        log.getLogger('smart_contract_lib').debug('RELOADED EVENTS', data, data.initial, data.expectedOutput);
        this.innerState = data;
    };

    *redrawDisplay() {
        if (this.display) {
            log.getLogger('smart_contract_lib').debug('make reset display');
        }
    };

    getComponent() {
        return this.display ? SmartContractView : null;
    }

    *getSaga(app: App) {
        log.getLogger('smart_contract_lib').debug('Start Smart Contract Lib Saga');

        yield* takeEvery(StepperActionTypes.StepperDisplayError, function* (action) {
            // @ts-ignore
            const {payload} = action;
            if (payload.error && 'task-submission-test-result-smart-contract' === payload.error.type) {
                // state
                const log = payload.error.props.log;
                const environment = yield* appSelect(state => state.environment);
                const context = quickAlgoLibraries.getContext(null, environment);
                if (context) {
                    const innerState: SmartContractLibState = {
                        resultLog: log,
                    };

                    yield* call(quickAlgoLibraryResetAndReloadStateSaga, app, innerState);
                    yield* put({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
                }
            }
        });
    }

    getErrorFromTestResult(testResult: TaskSubmissionServerTestResult) {
        try {
            const output = JSON.parse(testResult.output);
            if (output.success) {
                return null;
            }

            return {
                type: 'task-submission-test-result-smart-contract',
                props: {
                    log: output.log,
                },
                error: output.error.message,
            };

        } catch (e) {
            return testResult.log;
        }
    }
}
