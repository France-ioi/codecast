// Port of FioiBlockly's `Blockly.WorkspaceSvg.prototype.reportValue`: a box
// showing a value just above a block, with an arrow pointing at it, like a
// tooltip. Used to display the value a block evaluated to in step-by-step mode.
//
// It is Blockly's own DropDownDiv — the panel it opens under a dropdown field —
// filled with a plain string instead of a menu.

import * as Blockly from 'blockly/core';
import log from 'loglevel';

// DropDownDiv positions itself against a *field*, but we report on a whole
// block. All it ever asks of its owner is `getSourceBlock()` (to reach the
// workspace and the text direction), its bounding box when the window is
// resized, and its identity, to know whose drop-down is currently open — so a
// stand-in built around the block is enough.
function makeBlockOwner(block: Blockly.BlockSvg): Blockly.Field {
    return {
        getSourceBlock: () => block,
        // Only needed because DropDownDiv keeps positioning against a field once
        // any field editor has been opened, and repositions on window resize.
        getScaledBBox: () => getScaledBlockBox(block),
    } as unknown as Blockly.Field;
}

/** The block's bounding box, in page coordinates — the same box Blockly computes. */
function getScaledBlockBox(block: Blockly.BlockSvg): Blockly.utils.Rect {
    const scale = block.workspace.scale;
    const offset = Blockly.utils.style.getPageOffset(block.getSvgRoot());

    return new Blockly.utils.Rect(
        offset.y,
        offset.y + block.height * scale,
        offset.x,
        offset.x + block.width * scale,
    );
}

// DropDownDiv renders below its target whenever there is room, and only falls
// back to above when there isn't. We always want to be above the block, so that
// the box never covers the blocks that are about to run. There is no flag for
// that: the choice is made by comparing the below-position against the bottom of
// the viewport, so we hand it a below-position that can never fit.
const NEVER_FITS_BELOW = Number.MAX_SAFE_INTEGER;

// The owner we handed to DropDownDiv for the box currently shown, so that we
// only ever hide our own box and never a drop-down someone else opened.
let currentOwner: Blockly.Field = null;

/**
 * Shows `value` in a box just above the block with this id.
 */
export function reportValueOnBlock(workspace: Blockly.WorkspaceSvg, blockId: string, value: string) {
    const block = workspace.getBlockById(blockId);
    if (!block) {
        // The block may have been deleted since the code was generated. This is
        // called from the interpreter, so don't throw over a missing report box.
        log.getLogger('blockly_runner').debug('tried to report a value on a block that does not exist', blockId);

        return;
    }

    Blockly.DropDownDiv.createDom();
    Blockly.DropDownDiv.hideWithoutAnimation();
    // Recreates the div, so the content div can only be fetched after this.
    Blockly.DropDownDiv.clearContent();

    const valueReportBox = document.createElement('div');
    valueReportBox.className = 'valueReportBox';
    valueReportBox.textContent = value;
    Blockly.DropDownDiv.getContentDiv().appendChild(valueReportBox);

    Blockly.DropDownDiv.setColour('#FFFFFF', '#AAAAAA');

    // Keep the box within the workspace it belongs to, as Blockly's own
    // positioning shortcuts do. A workspace in a mutator bubble defers to the
    // one it is nested in.
    let rootWorkspace = block.workspace;
    while (rootWorkspace.options.parentWorkspace) {
        rootWorkspace = rootWorkspace.options.parentWorkspace;
    }
    Blockly.DropDownDiv.setBoundsElement(rootWorkspace.getParentSvg().parentElement);

    const blockBox = getScaledBlockBox(block);
    const blockCenterX = blockBox.left + (blockBox.right - blockBox.left) / 2;

    currentOwner = makeBlockOwner(block);
    // The second-to-last argument turns Blockly's ephemeral focus handling off:
    // the box is only there to be read, it must not take the focus away from the
    // workspace.
    Blockly.DropDownDiv.show(
        currentOwner,
        block.RTL,
        blockCenterX,
        NEVER_FITS_BELOW,
        blockCenterX,
        blockBox.top,
        false,
    );
}

/**
 * Hides the value report box, leaving any other drop-down alone — a field
 * editor the user opened, for instance.
 */
export function hideReportedValue() {
    if (currentOwner) {
        Blockly.DropDownDiv.hideIfOwner(currentOwner, true);
        currentOwner = null;
    }
}
