import {QuickAlgoLibrary} from "../quickalgo_library";

const localLanguageStrings = {
    fr: {
        description: {
            imread: "imread(image) ouvre l'image",
            cvtColor: "cvtColor(image, couleur) convertit l'image dans la couleur fournie",
            flip: "flip(image, flipCode) renverse l'image dans la direction choisie",
            resize: "resize(image, newSize) redimensionne l'image",
            blur: "blur(image, kernelSize) applique un flou sur l'image",
            rotate: "rotate(image, rotateCode) fait pivoter l'image",
            Canny: "Canny(image, threshold1, threshold2) détecte les contours sur une image",
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

        const blocksList = [
            'imread',
            'cvtColor',
            'flip',
            'resize',
            'blur',
            'rotate',
            'Canny',
            'imwrite',
        ];

        this.opencv = {};
        for (let block of blocksList) {
            this.opencv[block] = this.generateRemoteHandler('opencv', block);
        }

        this.customBlocks = {
            opencv: {
                opencv: [
                    { name: "imread", params: ["String"], yieldsValue: 'image'},
                    { name: "cvtColor", params: ["Image", "String"], yieldsValue: 'image'},
                    { name: "flip", params: ["Image", "String"], yieldsValue: 'image'},
                    { name: "resize", params: ["Image", null], yieldsValue: 'image'},
                    { name: "blur", params: ["Image", null], yieldsValue: 'image'},
                    { name: "rotate", params: ["Image", "String"], yieldsValue: 'image'},
                    { name: "Canny", params: ["Image", "Number", "Number"], yieldsValue: 'image'},
                    { name: "imwrite", params: ["String", "Image"]},
                ],
            }
        };

        this.customConstants = {
            opencv: [
                {name: 'COLOR_BGR2GRAY', value: 6},
                {name: 'ROTATE_90_CLOCKWISE', value: 0},
                {name: 'ROTATE_180', value: 1},
                {name: 'ROTATE_90_COUNTERCLOCKWISE', value: 2},
            ],
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
