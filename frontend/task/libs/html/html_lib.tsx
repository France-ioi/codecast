import {QuickAlgoLibrary} from "../quickalgo_library";
import {CodecastPlatform} from '../../../stepper/codecast_platform';
import {HtmlLibView} from './HtmlLibView';
import {BlockDocument} from '../../../buffers/buffer_types';
import {memoize} from 'proxy-memoize';
import {getBlocksFromXml} from '../../../stepper/js';
import {BlocklyBlock} from '../../../stepper/js/blockly_types';

const localLanguageStrings = {
    fr: {
        categories: {
            css_attributes: "Attributs CSS",
            css_selectors: 'Sélecteurs CSS',
        },
        label: {
            "font-size": "définir la taille de la police",
            "text-align": "définir l'alignement du texte",
            "selector_id": "pour toute balise ayant l'ID",
            "selector_class": "pour toute balise ayant la classe",
        },
        options: {
            left: 'gauche',
            center: 'centré',
            right: 'droite',
        },
        startingBlockName: "Feuille de style",
    },
};

export interface HtmlLibState {
}

export class HtmlLib extends QuickAlgoLibrary {
    html: any;
    htmlCustomBlocks: {[category: string]: {name: string, params: string[], blocklyJson?: any, handler: (block: BlocklyBlock) => string}[]};
    innerState: HtmlLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        this.htmlCustomBlocks = {
            css_attributes: [
                {
                    name: "font-size",
                    params: ['Number'],
                    handler(block: BlocklyBlock) {
                        return `font-size: ${block.getInputTargetBlock('PARAM_0').getFieldValue('NUM')}px;`;
                    },
                },
                {
                    name: "text-align",
                    params: ['String'],
                    blocklyJson: {
                        "args0": [{
                            "type": "field_dropdown",
                            "name": "PARAM_0",
                            "options": [
                                [localLanguageStrings[window.stringsLanguage].options.left, "left"],
                                [localLanguageStrings[window.stringsLanguage].options.center, "center"],
                                [localLanguageStrings[window.stringsLanguage].options.right, "right"],
                            ],
                        }],
                    },
                    handler(block: BlocklyBlock) {
                        return `text-align: ${block.getFieldValue('PARAM_0')};`;
                    },
                },
            ],
            css_selectors: [
                {
                    name: "selector_id",
                    params: ['String'],
                    blocklyJson: {
                        nextStatement: 0,
                    },
                    handler(block: BlocklyBlock) {
                        const blockId = block.getInputTargetBlock('PARAM_0').getFieldValue('TEXT');
                        if (!blockId) {
                            return '';
                        }

                        return `#${blockId} {
${this.extractBlockCss(block)}
}`;
                    },
                },
                {
                    name: "selector_class",
                    params: ['String'],
                    blocklyJson: {
                        nextStatement: 0,
                    },
                    handler(block: BlocklyBlock) {
                        const blockClass = block.getInputTargetBlock('PARAM_0').getFieldValue('TEXT');
                        console.log('block class', blockClass);
                        if (!blockClass) {
                            return '';
                        }

                        return `.${blockClass} {
${this.extractBlockCss(block)}
}`;
                    },
                },
            ],
        };

        this.customBlocks = {
            html: this.htmlCustomBlocks,
        };

        this.html = {
            convertBlocksIntoCss: memoize(this.convertBlocksIntoCss.bind(this)),
        };
        for (let blocks of Object.values(this.htmlCustomBlocks)) {
            for (let block of blocks) {
                this.html[block.name] = block.handler.bind(this);
            }
        }

        this.innerState = {
        };
    }

    extractBlockCss(blocklyBlock: BlocklyBlock) {
        let currentBlock = blocklyBlock;
        const cssParts = [];
        while (currentBlock.getNextBlock()) {
            currentBlock = currentBlock.getNextBlock();
            const fieldType = currentBlock.type;
            const css = this.html[fieldType](currentBlock);
            cssParts.push(css);
        }

        return cssParts.join("\n");
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
            CodecastPlatform.Blockly,
            CodecastPlatform.Scratch,
        ];
    };

    getComponent() {
        return this.display ? HtmlLibView : null;
    }

    provideBlocklyColours() {
        return {
            categories: {
                css_attributes: 30,
                css_selectors: 290,
            },
        };
    }

    convertBlocksIntoCss(document: BlockDocument) {
        const blocks = getBlocksFromXml(document.content.blockly);
        const cssFragments = [];
        for (let block of blocks) {
            const customBlock = this.htmlCustomBlocks['css_selectors'].find(customBlock => customBlock.name === block.type);
            if (customBlock) {
                const cssFragment = this.html[customBlock.name](block);
                cssFragments.push(cssFragment);
            }
        }

        return cssFragments.join("\n");
    }
}
