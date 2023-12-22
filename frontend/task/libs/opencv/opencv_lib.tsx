import {QuickAlgoLibrary} from "../quickalgo_library";

const localLanguageStrings = {
    fr: {
        description: {
            imread: "imread(image) ouvre l'image",
            cvtColor: "cvtColor(image, couleur) convertit l'image dans la couleur fournie",
            imwrite: "imwrite(fichier, image) enregistre l'image",
        },
    },
};

export interface OpenCvLibState {
}

export class OpenCvLib extends QuickAlgoLibrary {
    opencv: any;
    innerState: OpenCvLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        this.opencv = {
            imread: this.generateRemoteHandler('opencv', 'imread'),
            cvtColor: this.generateRemoteHandler('opencv', 'cvtColor'),
            imwrite: this.generateRemoteHandler('opencv', 'imwrite'),
        };

        this.customBlocks = {
            opencv: {
                opencv: [
                    { name: "imread", params: ["String"], yieldsValue: 'image'},
                    { name: "cvtColor", params: ["Image", "String"], yieldsValue: 'image'},
                    { name: "imwrite", params: ["String", "Image"]},
                ],
            }
        };

        this.innerState = {
        };
    }

    reset() {
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
}
