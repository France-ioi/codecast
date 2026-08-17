// Ported from FioiBlockly's core/block_svg.js help hooks.

import * as Blockly from 'blockly/core';

export interface BlocklyHelpHooks {
    /** Whether help is available for this block */
    exists: (block: Blockly.BlockSvg) => boolean;
    /** Display the help of this block */
    display: (block: Blockly.BlockSvg) => void;
}

/**
 * `false` disables the help, `null` uses the default Blockly behaviour (open
 * the `helpUrl` of the block), an object plugs a custom help in.
 */
let helpHooks: BlocklyHelpHooks|null|false = false;

export function setBlocklyHelpHooks(hooks: BlocklyHelpHooks|null|false) {
    helpHooks = hooks;
}

/**
 * Make the "Help" item of the block context menu use the hooks above. Blockly
 * hides the item when the block has no help; as FioiBlockly did, keep it
 * displayed but disabled, so that the menu doesn't change from block to block.
 */
export function registerBlockHelpContextMenuItem() {
    Blockly.ContextMenuRegistry.registry.unregister('blockHelp');
    Blockly.ContextMenuRegistry.registry.register({
        id: 'blockHelp',
        // Same scope and weight as the item it replaces, to keep its place in
        // the menu.
        scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
        weight: 7,
        displayText: () => Blockly.Msg['HELP'],
        preconditionFn: (scope) => {
            if (false === helpHooks) {
                return 'disabled';
            }
            if (helpHooks) {
                return helpHooks.exists(scope.block) ? 'enabled' : 'disabled';
            }

            const helpUrl = 'function' === typeof scope.block.helpUrl ? scope.block.helpUrl() : scope.block.helpUrl;

            return helpUrl ? 'enabled' : 'hidden';
        },
        callback: (scope) => {
            if (helpHooks) {
                helpHooks.display(scope.block);

                return;
            }

            scope.block.showHelp();
        },
    });
}
