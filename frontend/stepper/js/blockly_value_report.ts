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

/**
 * The block's own bounding box, in page coordinates.
 *
 * Blockly's own `getScaledBboxOfBlock` measures `block.width`, which is the
 * block's width *with* the blocks plugged into its inputs — so a block holding
 * another one on its right would get the box centred on the pair rather than on
 * itself. `getBoundingRectangleWithoutChildren()` measures the block alone.
 */
function getScaledBlockBox(block: Blockly.BlockSvg): Blockly.utils.Rect {
    const workspace = block.workspace;
    const bounds = block.getBoundingRectangleWithoutChildren();

    // Workspace coordinates, so they have to go through the workspace's scale and
    // scroll. That lands on viewport coordinates, one document scroll short of
    // the page coordinates DropDownDiv positions in.
    const toPageCoordinates = (x: number, y: number) => {
        const onScreen = Blockly.utils.svgMath.wsToScreenCoordinates(workspace, new Blockly.utils.Coordinate(x, y));

        return Blockly.utils.Coordinate.sum(onScreen, Blockly.utils.svgMath.getDocumentScroll());
    };

    // The two corners come back swapped in a right-to-left workspace.
    const first = toPageCoordinates(bounds.left, bounds.top);
    const second = toPageCoordinates(bounds.right, bounds.bottom);

    return new Blockly.utils.Rect(
        Math.min(first.y, second.y),
        Math.max(first.y, second.y),
        Math.min(first.x, second.x),
        Math.max(first.x, second.x),
    );
}

// DropDownDiv renders below its target whenever there is room, and only falls
// back to above when there isn't. We always want to be above the block, so that
// the box never covers the blocks that are about to run. There is no flag for
// that: the choice is made by comparing the below-position against the bottom of
// the viewport, so we hand it a below-position that can never fit.
const NEVER_FITS_BELOW = Number.MAX_SAFE_INTEGER;

const VERTICAL_GAP = 8;

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
        blockBox.top + (Blockly.DropDownDiv.PADDING_Y - VERTICAL_GAP),
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
