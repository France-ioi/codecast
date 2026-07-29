import * as Blockly from 'blockly/core';
import {BlocklyColours} from '../blockly_types';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';

const QUOTE_OPEN_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAYAAACALL/6AAAA0UlEQVQY023QP0oDURSF8e8MImhlUIiCjWKhrUUK3YCIVkq6bMAF2LkCa8ENWLoNS1sLEQKprMQ/GBDks3kDM+Oc8nfPfTxuANQTYBeYAvdJLL4FnAFfwF2ST9Rz27kp5YH/kwrYp50LdaXHAU4rYNYzWAdeenx7AbgF5sAhcARsAkkyVQ+ACbAKjIGqta4+l78udXxc/LiJG+qvet0pV+q7+tHE+iJzdbGz8FhmOzVcqj/qq7rcKI7Ut1Leq70C1oCrJMMk343HB8ADMEzyVOMff72l48gwfqkAAAAASUVORK5CYII=';
const QUOTE_CLOSED_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAYAAACALL/6AAAAvklEQVQY022PoapCQRRF97lBVDRYhBcEQcP1BwS/QLAqr7xitZn0HzRr8Rts+htmQdCqSbQIwmMZPMIw3lVmZu0zG44UAFSBLdBVBDAFZqFo8eYKtANfBC7AE5h8ZNOHd1FrDnh4VgmDO3ADkujDHPgHfkLZ84bfaLjg/hD6RFLq9z6wBDr+rvuZB1bAEDABY76pA2mGHyWSjvqmIemc4WsCLKOp4nssIj8wD8qS/iSVJK3N7OTeJPV9n72ZbV7iDuSc2BaQBQAAAABJRU5ErkJggg==';

/**
 * Create an image of an open or closed quote.
 */
function newQuote_(this: Blockly.Block, open: boolean): Blockly.FieldImage {
    const file = open === this.RTL ? QUOTE_OPEN_IMAGE : QUOTE_CLOSED_IMAGE;

    return new Blockly.FieldImage(file, 12, 12, '"');
}

export function addDictBlocks(defaultColors: BlocklyColours) {
    Blockly.Blocks['dict_get'] = {
        init: function() {
            this.setColour(defaultColors.categories['dicts']);
            this.appendValueInput('ITEM');
            this.appendValueInput('DICT')
                .setCheck('dict')
                .appendField(Blockly.Msg['DICT_GET_TO']);
            this.setInputsInline(false);
            this.setOutput(true);
        }
    };

    javascriptGenerator.forBlock['dict_get'] = function(block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT',
            JavascriptOrder.MEMBER) || '___';
        const value = javascriptGenerator.valueToCode(block, 'ITEM',
            JavascriptOrder.NONE) || '___';

        return [`${dict}.${value}`, JavascriptOrder.ATOMIC];
    }

    pythonGenerator.forBlock['dict_get'] = function(block) {
        const dict = pythonGenerator.valueToCode(block, 'DICT',
            PythonOrder.MEMBER) || '___';
        const value = pythonGenerator.valueToCode(block, 'ITEM',
            PythonOrder.NONE) || '___';

        return [`${dict}[${value}]`, PythonOrder.ATOMIC];
    }

    Blockly.Blocks['dict_get_literal'] = {
        init: function() {
            this.setColour(defaultColors.categories['dicts']);
            this.appendValueInput('DICT')
                .appendField(this.newQuote_(true))
                .appendField(new Blockly.FieldTextInput(
                    Blockly.Msg['DICTS_CREATE_WITH_ITEM_KEY']),
                'ITEM')
                .appendField(this.newQuote_(false))
                .setCheck('dict')
                .appendField(Blockly.Msg['DICT_GET_TO']);
            this.setInputsInline(false);
            this.setOutput(true);
        },
        newQuote_,
    };

    javascriptGenerator.forBlock['dict_get_literal'] = function(block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT',
            JavascriptOrder.MEMBER) || '___';
        const value = block.getFieldValue('ITEM');

        return [`${dict}.${value}`, JavascriptOrder.ATOMIC];
    }

    pythonGenerator.forBlock['dict_get_literal'] = function(block) {
        const dict = pythonGenerator.valueToCode(block, 'DICT',
            PythonOrder.MEMBER) || '___';
        const value = pythonGenerator.quote_(block.getFieldValue('ITEM'));

        return [`${dict}[${value}]`, PythonOrder.ATOMIC];
    }

    Blockly.Blocks['dict_set_literal'] = {
        init: function() {
            this.setColour(defaultColors.categories['dicts']);
            this.appendValueInput('DICT')
                .appendField(Blockly.Msg['DICT_SET_TITLE'])
                .appendField(this.newQuote_(true))
                .appendField(new Blockly.FieldTextInput(
                    Blockly.Msg['DICTS_CREATE_WITH_ITEM_KEY']),
                'ITEM')
                .appendField(this.newQuote_(false))
                .setCheck('dict')
                .appendField(Blockly.Msg['DICT_SET_OF']);
            this.appendValueInput('VAL')
                .appendField(Blockly.Msg['DICT_SET_TO']);
            this.setInputsInline(true);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
        },
        newQuote_,
    };

    javascriptGenerator.forBlock['dict_set_literal'] = function(block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT',
            JavascriptOrder.MEMBER) || '___';
        const key = block.getFieldValue('ITEM');
        const value = javascriptGenerator.valueToCode(block, 'VAL',
            JavascriptOrder.NONE) || '___';

        return `${dict}.${key} = ${value};\n`;
    }

    pythonGenerator.forBlock['dict_set_literal'] = function(block) {
        const dict = pythonGenerator.valueToCode(block, 'DICT',
            PythonOrder.MEMBER) || '___';
        const key = pythonGenerator.quote_(block.getFieldValue('ITEM'));
        const value = pythonGenerator.valueToCode(block, 'VAL',
            PythonOrder.NONE) || '___';

        return `${dict}[${key}] = ${value}\n`;
    }

    Blockly.Blocks['dict_keys'] = {
        init: function() {
            this.setColour(defaultColors.categories['dicts']);
            this.appendValueInput('DICT')
                .setCheck('dict')
                .appendField(Blockly.Msg['DICT_KEYS']);
            this.setInputsInline(false);
            this.setOutput(true, 'Array');
        }
    };

    javascriptGenerator.forBlock['dict_keys'] = function(block) {
        const dict = javascriptGenerator.valueToCode(block, 'DICT',
            JavascriptOrder.MEMBER) || '___';

        return [`Object.keys(${dict})`, JavascriptOrder.ATOMIC];
    }

    pythonGenerator.forBlock['dict_keys'] = function(block) {
        const dict = pythonGenerator.valueToCode(block, 'DICT',
            PythonOrder.MEMBER) || '___';

        return [`${dict}.keys()`, PythonOrder.ATOMIC];
    }

    Blockly.Blocks['dicts_create_with_container'] = {
        // Container.
        init: function() {
            this.setColour(defaultColors.categories['dicts']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['DICTS_CREATE_WITH_CONTAINER_TITLE_ADD']);
            this.appendStatementInput('STACK');
            this.setTooltip(Blockly.Msg['DICTS_CREATE_WITH_CONTAINER_TOOLTIP']);
            this.contextMenu = false;
        }
    };

    Blockly.Blocks['dicts_create_with_item'] = {
        // Add items.
        init: function() {
            this.setColour(defaultColors.categories['dicts']);
            this.appendDummyInput()
                .appendField(Blockly.Msg['DICTS_CREATE_WITH_ITEM_TITLE']);
            this.setPreviousStatement(true);
            this.setNextStatement(true);
            this.setTooltip(Blockly.Msg['DICTS_CREATE_WITH_ITEM_TOOLTIP']);
            this.contextMenu = false;
        }
    };

    Blockly.Blocks['dicts_create_with'] = {
        /**
         * Block for creating a dict with any number of elements of any type.
         */
        init: function() {
            this.setInputsInline(false);
            this.setColour(defaultColors.categories['dicts']);
            this.itemCount_ = 1;
            this.updateShape_();
            this.setOutput(true, 'dict');
            this.setMutator(new Blockly.icons.MutatorIcon(['dicts_create_with_item'], this));
            this.setTooltip(Blockly.Msg['DICTS_CREATE_WITH_TOOLTIP']);
        },
        /**
         * Create XML to represent dict inputs.
         */
        mutationToDom: function() {
            const container = Blockly.utils.xml.createElement('mutation');
            container.setAttribute('items', String(this.itemCount_));

            return container;
        },
        /**
         * Parse XML to restore the dict inputs.
         */
        domToMutation: function(xmlElement: Element) {
            this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
            this.updateShape_();
        },
        /**
         * Modify this block to have the correct number of inputs.
         */
        updateShape_: function() {
            // Delete everything.
            if (this.getInput('EMPTY')) {
                this.removeInput('EMPTY');
            }
            for (let i = 0; this.getInput('VALUE' + i); i++) {
                this.removeInput('VALUE' + i);
            }
            // Rebuild block.
            if (0 === this.itemCount_) {
                this.appendDummyInput('EMPTY')
                    .appendField(Blockly.Msg['DICTS_CREATE_EMPTY_TITLE']);
            } else {
                this.appendDummyInput('EMPTY')
                    .appendField(Blockly.Msg['DICTS_CREATE_WITH_INPUT_WITH']);
                for (let i = 0; i < this.itemCount_; i++) {
                    this.appendValueInput('VALUE' + i)
                        .setCheck(null)
                        .setAlign(Blockly.inputs.Align.RIGHT)
                        .appendField(
                            new Blockly.FieldTextInput(
                                Blockly.Msg['DICTS_CREATE_WITH_ITEM_KEY']),
                            'KEY' + i)
                        .appendField(Blockly.Msg['DICTS_CREATE_WITH_ITEM_MAPPING']);
                }
            }
        },
        /**
         * Populate the mutator's dialog with this block's components.
         */
        decompose: function(workspace: Blockly.WorkspaceSvg) {
            const containerBlock = workspace.newBlock('dicts_create_with_container');
            containerBlock.initSvg();
            let connection = containerBlock.getInput('STACK').connection;
            for (let i = 0; i < this.itemCount_; i++) {
                const itemBlock = workspace.newBlock('dicts_create_with_item');
                itemBlock.initSvg();
                connection.connect(itemBlock.previousConnection);
                connection = itemBlock.nextConnection;
            }

            return containerBlock;
        },
        /**
         * Reconfigure this block based on the mutator dialog's components.
         */
        compose: function(containerBlock: Blockly.Block) {
            let itemBlock = containerBlock.getInputTargetBlock('STACK');
            // Count number of inputs.
            const connections = [];
            let i = 0;
            while (itemBlock) {
                connections[i] = itemBlock.valueConnection_;
                itemBlock = itemBlock.nextConnection &&
                    itemBlock.nextConnection.targetBlock();
                i++;
            }
            this.itemCount_ = i;
            this.updateShape_();
            // Reconnect any child blocks.
            for (let j = 0; j < this.itemCount_; j++) {
                if (connections[j]) {
                    this.getInput('VALUE' + j).connection.connect(connections[j]);
                }
            }
        },
        /**
         * Store pointers to any connected child blocks.
         */
        saveConnections: function(containerBlock: Blockly.Block) {
            let itemBlock = containerBlock.getInputTargetBlock('STACK');
            let i = 0;
            while (itemBlock) {
                const valueInput = this.getInput('VALUE' + i);
                itemBlock.valueConnection_ = valueInput && valueInput.connection.targetConnection;
                i++;
                itemBlock = itemBlock.nextConnection &&
                    itemBlock.nextConnection.targetBlock();
            }
        }
    };

    javascriptGenerator.forBlock['dicts_create_with'] = function(block) {
        const itemCount = (block as unknown as {itemCount_: number}).itemCount_;
        const items = [];
        for (let i = 0; i < itemCount; i++) {
            const key = block.getFieldValue('KEY' + i);
            const value = javascriptGenerator.valueToCode(block, 'VALUE' + i,
                JavascriptOrder.NONE) || '___';
            items.push(`${key}: ${value}`);
        }

        return [`Object({${items.join(', ')}})`, JavascriptOrder.ATOMIC];
    }

    pythonGenerator.forBlock['dicts_create_with'] = function(block) {
        const itemCount = (block as unknown as {itemCount_: number}).itemCount_;
        const items = [];
        for (let i = 0; i < itemCount; i++) {
            const key = pythonGenerator.quote_(block.getFieldValue('KEY' + i));
            const value = pythonGenerator.valueToCode(block, 'VALUE' + i,
                PythonOrder.NONE) || '___';
            items.push(`${key}: ${value}`);
        }

        return [`{${items.join(', ')}}`, PythonOrder.ATOMIC];
    }
}
