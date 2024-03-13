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
            css: "CSS",
        },
        label: {
            "font-size": "font-size:",
            "text-align": "text-align:",
            "css_selector": "sur le sélecteur",
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

interface HtmlCustomBlock {
    name: string,
    params: string[],
    blocklyJson?: any,
    blocklyXml?: string,
    blocklyInit?: () => void,
    handler: (block: BlocklyBlock) => string,
}

export class HtmlLib extends QuickAlgoLibrary {
    html: any;
    htmlCustomBlocks: {[category: string]: HtmlCustomBlock[]};
    innerState: HtmlLibState;

    constructor (display, infos) {
        super(display, infos);

        this.setLocalLanguageStrings(localLanguageStrings);

        this.htmlCustomBlocks = {
            css: [
                {
                    name: "css_selector",
                    params: ['String'],
                    blocklyInit() {
                        return function () {
                            this.setColour(290);
                            this.appendValueInput("SELECTOR").appendField("sur le sélecteur");
                            this.appendStatementInput("STYLE").appendField("style");
                            this.setPreviousStatement(false);
                            this.setNextStatement(true);
                        };
                    },
                    handler(block: BlocklyBlock) {
                        const selectorBlock = block.getInputTargetBlock('SELECTOR');
                        if (!selectorBlock) {
                            return '';
                        }

                        const selectorText = this.extractBlockCss(selectorBlock);

                        const styleBlock = block.getInputTargetBlock('STYLE');

                        const styleText = this.extractBlockCss(styleBlock);

                        return `${selectorText} {
${styleText}
}`;
                    },
                },
                {
                    name: "partial_selector",
                    params: ['String'],
                    blocklyJson: {
                        colour: 290,
                        args0: [
                            {name: "SELECTOR", type: "field_input"},
                            {name: "NEXT", type: "input_value"},
                        ],
                        output: true,
                        message0: "%1 %2"
                    },
                    blocklyXml: '<block type="partial_selector"><field name="SELECTOR"></field></block>',
                    handler(block: BlocklyBlock) {
                        const partialSelectorValue = block.getFieldValue('SELECTOR');
                        const nextBlock = block.getInputTargetBlock('NEXT');

                        if (nextBlock) {
                            const nextStyleText = this.extractBlockCss(nextBlock);

                            return `${partialSelectorValue}${nextStyleText}`;
                        }

                        return partialSelectorValue;
                    },
                },
                {
                    name: "font-size",
                    params: ['Number'],
                    blocklyXml: "<block type='font-size'>" +
                            "  <value name='PARAM_0'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>0</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    handler(block: BlocklyBlock) {
                        return `font-size: ${block.getInputTargetBlock('PARAM_0')?.getFieldValue('NUM')}px;`;
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
                                ['left', 'left'],
                                ['center', 'center'],
                                ['right', 'right'],
                            ],
                        }],
                    },
                    handler(block: BlocklyBlock) {
                        return `text-align: ${block.getFieldValue('PARAM_0')};`;
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
        while (currentBlock) {
            const fieldType = currentBlock.type;
            const css = this.html[fieldType](currentBlock);
            cssParts.push(css);
            currentBlock = currentBlock.getNextBlock();
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
                css: 30,
            },
        };
    }

    convertBlocksIntoCss(document: BlockDocument) {
        if (!document?.content?.blockly) {
            return '';
        }

        const blocks = getBlocksFromXml(document.content.blockly);
        const cssFragments = [];
        for (let block of blocks) {
            const customBlock = this.htmlCustomBlocks['css'].find(customBlock => customBlock.name === block.type);
            if (customBlock) {
                const cssFragment = this.html[customBlock.name](block);
                cssFragments.push(cssFragment);
            }
        }

        return cssFragments.join("\n");
    }
}
