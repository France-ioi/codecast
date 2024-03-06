import {QuickAlgoLibrary} from "../quickalgo_library";
import {CodecastPlatform} from '../../../stepper/codecast_platform';

const localLanguageStrings = {
};

export interface HtmlLibState {
}

export class HtmlLib extends QuickAlgoLibrary {
    debug: any;
    innerState: HtmlLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        this.debug = {
            // log: this.log,
        };

        this.customBlocks = {
            debug: {
                debug: [
                    // { name: "log", params: [null], variants: [[null], [null, null]], anyArgs: true},
                ],
            }
        };

        this.innerState = {
        };
    }

    reset() {
        // this.innerState.linesLogged = [];
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

    getSupportedPlatforms() {
        return [
            CodecastPlatform.Html,
        ];
    };
}
