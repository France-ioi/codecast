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
            js: "JS",
        },
        label: {
            "font-size": "font-size:",
            "text-align": "text-align:",
            "background-color": "background-color:",
            "color": "color:",
            "width": "width:",
            "height": "height:",
            "css_selector": "sur le sélecteur",
            "change_attribute": "changer l'attribut",
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
                            this.setNextStatement(false);
                        };
                    },
                    handler(block: BlocklyBlock) {
                        const selectorBlock = block.getInputTargetBlock('SELECTOR');
                        if (!selectorBlock) {
                            return '';
                        }

                        const selectorText = this.extractBlockRecursive(selectorBlock);

                        const styleBlock = block.getInputTargetBlock('STYLE');

                        const styleText = this.extractBlockRecursive(styleBlock);

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

                        return `${partialSelectorValue}${nextBlock ? this.extractBlockRecursive(nextBlock) : ''}`;
                    },
                },
                {
                    name: "class_selector",
                    params: ['String'],
                    blocklyJson: {
                        colour: 290,
                        args0: [
                            {name: "SELECTOR", type: "field_input"},
                            {name: "NEXT", type: "input_value"},
                        ],
                        output: true,
                        message0: "de classe %1 %2"
                    },
                    blocklyXml: '<block type="class_selector"><field name="SELECTOR"></field></block>',
                    handler(block: BlocklyBlock) {
                        const partialSelectorValue = block.getFieldValue('SELECTOR');
                        const nextBlock = block.getInputTargetBlock('NEXT');

                        return `.${partialSelectorValue}${nextBlock ? this.extractBlockRecursive(nextBlock) : ''}`;
                    },
                },
                {
                    name: "id_selector",
                    params: ['String'],
                    blocklyJson: {
                        colour: 290,
                        args0: [
                            {name: "SELECTOR", type: "field_input"},
                            {name: "NEXT", type: "input_value"},
                        ],
                        output: true,
                        message0: "d'id %1 %2"
                    },
                    blocklyXml: '<block type="id_selector"><field name="SELECTOR"></field></block>',
                    handler(block: BlocklyBlock) {
                        const partialSelectorValue = block.getFieldValue('SELECTOR');
                        const nextBlock = block.getInputTargetBlock('NEXT');

                        return `#${partialSelectorValue}${nextBlock ? this.extractBlockRecursive(nextBlock) : ''}`;
                    },
                },
                {
                    name: "element_selector",
                    params: ['String'],
                    blocklyJson: {
                        colour: 290,
                        args0: [
                            {name: "SELECTOR", type: "field_input"},
                            {name: "NEXT", type: "input_value"},
                        ],
                        output: true,
                        message0: "d'élément %1 %2"
                    },
                    blocklyXml: '<block type="element_selector"><field name="SELECTOR"></field></block>',
                    handler(block: BlocklyBlock) {
                        const partialSelectorValue = block.getFieldValue('SELECTOR');
                        const nextBlock = block.getInputTargetBlock('NEXT');

                        return `${partialSelectorValue}${nextBlock ? this.extractBlockRecursive(nextBlock) : ''}`;
                    },
                },
                {
                    name: "font-size",
                    params: ['Number'],
                    blocklyJson: {
                        args0: [
                            {name: "SIZE", type: "input_value", check: "Number"},
                        ],
                        message0: "font-size: %1 px"
                    },
                    blocklyXml: "<block type='font-size'>" +
                        "  <value name='SIZE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'>16</field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    handler(block: BlocklyBlock) {
                        return `font-size: ${block.getInputTargetBlock('SIZE')?.getFieldValue('NUM')}px;`;
                    },
                },
                {
                    name: "text-align",
                    params: ['String'],
                    blocklyJson: {
                        "args0": [{
                            "type": "field_dropdown",
                            "name": "ALIGNMENT",
                            "options": [
                                ['left', 'left'],
                                ['center', 'center'],
                                ['right', 'right'],
                            ],
                        }],
                    },
                    handler(block: BlocklyBlock) {
                        return `text-align: ${block.getFieldValue('ALIGNMENT')};`;
                    },
                },
                {
                    name: "background-color",
                    params: ['String'],
                    blocklyJson: {
                        "args0": [{
                            "type": "field_colour",
                            "name": "COLOR",
                        }],
                    },
                    handler(block: BlocklyBlock) {
                        return `background-color: ${block.getFieldValue('COLOR')};`;
                    },
                },
                {
                    name: "color",
                    params: ['String'],
                    blocklyJson: {
                        "args0": [{
                            "type": "field_colour",
                            "name": "COLOR",
                        }],
                    },
                    handler(block: BlocklyBlock) {
                        return `color: ${block.getFieldValue('COLOR')};`;
                    },
                },
                {
                    name: "width",
                    params: ['Number'],
                    blocklyJson: {
                        args0: [
                            {name: "SIZE", type: "input_value", check: "Number"},
                        ],
                        message0: "width: %1 px"
                    },
                    blocklyXml: "<block type='width'>" +
                        "  <value name='SIZE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'></field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    handler(block: BlocklyBlock) {
                        return `width: ${block.getInputTargetBlock('SIZE')?.getFieldValue('NUM')}px;`;
                    },
                },
                {
                    name: "height",
                    params: ['Number'],
                    blocklyJson: {
                        args0: [
                            {name: "SIZE", type: "input_value", check: "Number"},
                        ],
                        message0: "height: %1 px"
                    },
                    blocklyXml: "<block type='height'>" +
                        "  <value name='SIZE'>" +
                        "    <shadow type='math_number'>" +
                        "      <field name='NUM'></field>" +
                        "    </shadow>" +
                        "  </value>" +
                        "</block>",
                    handler(block: BlocklyBlock) {
                        return `height: ${block.getInputTargetBlock('SIZE')?.getFieldValue('NUM')}px;`;
                    },
                },
            ],
            js: [
                {
                    name: "js_event",
                    params: [null, null],
                    blocklyInit() {
                        return function () {
                            this.setColour(290);
                            this.appendValueInput('SELECTOR')
                                .appendField("en cas d'évènement")
                                .appendField(new window.Blockly.FieldDropdown([
                                    ['onclick', 'onclick'],
                                ]), 'EVENT')
                                .appendField('sur le sélecteur')
                            this.appendStatementInput("ACTIONS").appendField("actions");
                            this.setPreviousStatement(false);
                            this.setNextStatement(false);
                        };
                    },
                    handler(block: BlocklyBlock) {
                        const selectorBlock = block.getInputTargetBlock('SELECTOR');
                        if (!selectorBlock) {
                            return '';
                        }
                        
                        const eventName = block.getFieldValue('EVENT');
                        const selectorText = this.extractBlockRecursive(selectorBlock);
                        const actionsBlock = block.getInputTargetBlock('ACTIONS');
                        const actionsText = this.extractBlockRecursive(actionsBlock);

                        return `var elements = document.querySelectorAll("${selectorText}");
elements.forEach(function (element) {
    element['${eventName}'] = function () {
        ${actionsText}
    };
});`;
                    },
                },
                {
                    name: "add_class",
                    params: ['String', null],
                    blocklyInit() {
                        return function () {
                            this.setColour(45);
                            this.appendValueInput('SELECTOR')
                                .appendField("ajouter la classe")
                                .appendField(new window.Blockly.FieldTextInput(''), "CLASS")
                                .appendField('sur le sélecteur');
                            this.setPreviousStatement(true);
                            this.setNextStatement(true);
                        };
                    },
                    handler(block: BlocklyBlock) {
                        const selectorBlock = block.getInputTargetBlock('SELECTOR');
                        if (!selectorBlock) {
                            return '';
                        }

                        const className = block.getFieldValue('CLASS');

                        const selectorText = this.extractBlockRecursive(selectorBlock);

                        return `var innerElements = document.querySelectorAll("${selectorText}");
innerElements.forEach(function (innerElement) {
    innerElement.classList.add('${className}');
});`;
                    },
                },
            ]
        };

        this.customBlocks = {
            html: this.htmlCustomBlocks,
        };

        this.html = {
            convertBlocksIntoCss: memoize(this.convertBlocksIntoCss.bind(this)),
            convertBlocksIntoJs: memoize(this.convertBlocksIntoJs.bind(this)),
        };
        for (let blocks of Object.values(this.htmlCustomBlocks)) {
            for (let block of blocks) {
                this.html[block.name] = block.handler.bind(this);
            }
        }

        this.innerState = {
        };
    }

    extractBlockRecursive(blocklyBlock: BlocklyBlock) {
        let currentBlock = blocklyBlock;
        const parts = [];
        while (currentBlock) {
            const fieldType = currentBlock.type;
            if (!(fieldType in this.html)) {
                break;
            }
            const blockContent = this.html[fieldType](currentBlock);
            parts.push(blockContent);
            currentBlock = currentBlock.getNextBlock();
        }

        return parts.join("\n");
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
        return this.convertBlocksIntoLang(document, 'css', ['css_selector']);
    }

    convertBlocksIntoJs(document: BlockDocument) {
        console.log('convert js', document);
        return this.convertBlocksIntoLang(document, 'js', ['js_event']);
    }

    convertBlocksIntoLang(document: BlockDocument, mainCategory: string, rootBlockTypes: string[]) {
        if (!document?.content?.blockly) {
            return '';
        }

        const blocks = getBlocksFromXml(document.content.blockly);
        const cssFragments = [];
        for (let block of blocks) {
            if (-1 === rootBlockTypes.indexOf(block.type)) {
                continue;
            }

            const customBlock = this.htmlCustomBlocks[mainCategory].find(customBlock => customBlock.name === block.type);
            if (customBlock) {
                const cssFragment = this.html[customBlock.name](block);
                cssFragments.push(cssFragment);
            }
        }

        return cssFragments.join("\n");
    }
}
