// `@blockly/block-plus-minus` replaces the mutator dialog of a handful of blocks
// — "if", "create list with", "create text with" and the two function definition
// blocks — with "+" and "−" buttons on the block itself. A task opts into it
// with the `plusMinusEnabled` option, so both versions have to stay available
// for as long as the page lives: importing the plugin is a one-way change to the
// block and extension registries, which is why blockly_stock_blocks.ts takes a
// copy of what it overwrites, and why the import below must stay under that one.
//
// Nothing else should import the plugin.

import {
    captureBlockDefinitions,
    captureMutatorExtensions,
    PLUS_MINUS_BLOCK_TYPES,
    PLUS_MINUS_MUTATOR_NAMES,
    stockBlockDefinitions,
    stockMutatorExtensions,
} from './blockly_stock_blocks';
import '@blockly/block-plus-minus';
import * as Blockly from 'blockly/core';

const plusMinusBlockDefinitions = captureBlockDefinitions();

const plusMinusMutatorExtensions = captureMutatorExtensions();

/**
 * Installs the version of the blocks the task asked for.
 *
 * Called on every task load, before the blocks are customized, and it installs a
 * *copy* of each definition: the customizations are applied by mutating the
 * definition in place, so they would otherwise pile up from one task to the next.
 */
export function setPlusMinusBlocksEnabled(enabled: boolean) {
    const blockDefinitions = enabled ? plusMinusBlockDefinitions : stockBlockDefinitions;
    for (const type of PLUS_MINUS_BLOCK_TYPES) {
        Blockly.Blocks[type] = {...blockDefinitions[type]};
    }

    const mutatorExtensions = enabled ? plusMinusMutatorExtensions : stockMutatorExtensions;
    for (const name of PLUS_MINUS_MUTATOR_NAMES) {
        if (Blockly.Extensions.isRegistered(name)) {
            Blockly.Extensions.unregister(name);
        }
        // A mutator registered with `registerMutator` is a plain function by the
        // time it reaches the registry, so it goes back in as a plain extension.
        Blockly.Extensions.register(name, mutatorExtensions[name]);
    }
}
