import {QuickAlgoLibrary} from "../quickalgo_library";

const localLanguageStrings = {
    fr: {
        label: {
            log: "ajouter une ligne de debug",
        },
        code: {
            log: "log",
        },
        description: {
            log: "log(texte) ajoute une ligne de debug sur le terminal",
        },
    },
    en: {
        label: {
            log: "add a debug line",
        },
        code: {
            log: "log",
        },
        description: {
            log: "log(text) adds a debug line on the terminal",
        },
    },
};

export interface DebugLibState {
    linesLogged: string[],
}

export class DebugLib extends QuickAlgoLibrary {
    debug: any;
    innerState: DebugLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        this.debug = {
            log: this.log,
        };

        this.customBlocks = {
            debug: {
                debug: [
                    { name: "log", params: [null], variants: [[null], [null, null]], anyArgs: true},
                ],
            }
        };

        this.innerState = {
            linesLogged: [],
        };
    }

    reset() {
        this.innerState.linesLogged = [];
    };

    getInnerState() {
        return this.innerState;
    };

    implementsInnerState() {
        return true;
    }

    reloadInnerState(data): void {
        this.innerState = data;
    };

    *log(text: string) {
        this.innerState.linesLogged.push(text);
    }
}
