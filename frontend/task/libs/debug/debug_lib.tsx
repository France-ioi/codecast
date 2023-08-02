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
        startingBlockName: "Programme",
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
                print: [
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
