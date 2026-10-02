// Blockly's own definitions for the blocks `@blockly/block-plus-minus` replaces,
// captured before the plugin gets a chance to replace them.
//
// The plugin does its work at import time, and destructively: it deletes the
// blocks it redefines from `Blockly.Blocks`, and unregisters the mutators two of
// them name, because neither registry offers a way to put a definition back. So
// whatever is to be restored has to be taken a copy of first, which is what this
// module does — it is imported by blockly_plus_minus.ts ahead of the plugin, and
// module bodies run in import order. Nothing else should import the plugin.

import * as Blockly from 'blockly/core';
import 'blockly/blocks';

/** The definition object `Blockly.Blocks` maps a block type to. */
export type BlockDefinition = {[property: string]: unknown};

/** The function `Blockly.Extensions` maps an extension name to. */
export type ExtensionFunction = (this: Blockly.Block) => void;

/** The blocks `@blockly/block-plus-minus` redefines. */
export const PLUS_MINUS_BLOCK_TYPES = [
    'controls_if',
    'lists_create_with',
    'text_join',
    'procedures_defnoreturn',
    'procedures_defreturn',
];

/**
 * The mutators the plugin registers again under the name they already had.
 *
 * `controls_if` and `text_join` are defined in JSON and name their mutator, so
 * putting Blockly's definition of the block back is only half of the work: the
 * name has to lead to Blockly's mutator again. The mutators of the other three
 * blocks are registered by the plugin under names of its own, and so are only
 * ever reached from its version of the block.
 */
export const PLUS_MINUS_MUTATOR_NAMES = [
    'controls_if_mutator',
    'text_join_mutator',
];

/** The definitions currently registered for {@link PLUS_MINUS_BLOCK_TYPES}. */
export function captureBlockDefinitions(): {[type: string]: BlockDefinition} {
    const definitions = {};
    for (const type of PLUS_MINUS_BLOCK_TYPES) {
        definitions[type] = Blockly.Blocks[type];
    }

    return definitions;
}

/**
 * The functions currently registered for {@link PLUS_MINUS_MUTATOR_NAMES}.
 *
 * `Blockly.Extensions` has no getter — an extension is meant to be registered
 * once and only ever reached by name — so this reads the registry the plugin
 * itself has to reach for to unregister what it replaces.
 */
export function captureMutatorExtensions(): {[name: string]: ExtensionFunction} {
    const extensions = {};
    for (const name of PLUS_MINUS_MUTATOR_NAMES) {
        extensions[name] = Blockly.Extensions.TEST_ONLY.allExtensions[name];
    }

    return extensions;
}

export const stockBlockDefinitions = captureBlockDefinitions();

export const stockMutatorExtensions = captureMutatorExtensions();
