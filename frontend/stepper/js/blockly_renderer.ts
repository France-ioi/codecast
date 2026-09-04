// A Zelos renderer whose multi-row blocks stack their input sockets in a column,
// the way Geras does. Zelos hard-sets `isInline` on its render info and instead
// drives row breaks from `isMultiRow`, so a block with external inputs still gets
// inline sockets — drawn inside the block, at the x the row's own fields leave them
// at — rather than Geras' external ones, whose connection sits at the block's right
// edge and so lands at the same x on every row. On `A and B` that puts the socket of
// the first row flush against the left edge and the one of the second row after the
// `and` dropdown, a staircase we would rather not have.

import * as Blockly from 'blockly/core';

const Types = Blockly.blockRendering.Types;

/** Name to hand `Blockly.inject` as its `renderer` option. */
export const ALIGNED_ZELOS_RENDERER = 'zelos-aligned';

/**
 * True for the elements a row draws a socket for, whichever kind Zelos picked.
 */
function isInputElement(element: Blockly.blockRendering.Measurable): boolean {
    return Types.isInlineInput(element) || Types.isExternalInput(element);
}

class AlignedRenderInfo extends Blockly.zelos.RenderInfo {
    protected override alignRowElements_() {
        this.alignInputStarts_();
        super.alignRowElements_();
    }

    /**
     * Widens the leading spacer of every input row until each row's socket starts at
     * the same x, indenting the rows whose fields are narrower than the widest ones.
     *
     * This has to run before the base alignment pass: that one stretches each row to
     * the block width, and a row already at that width would have no slack left to
     * take the indent from. Rows that grow past the block width are the reason for
     * the `this.width` bump — that width was measured in `computeBounds_`, before we
     * moved anything, and the outline would otherwise clip whatever sticks out.
     */
    private alignInputStarts_() {
        const offsets = new Map<Blockly.blockRendering.Row, number>();
        let widestOffset = 0;
        for (const row of this.rows) {
            // Statement rows put their notch, not a socket, at the end of their fields.
            if (!Types.isInputRow(row) || row.hasStatement) {
                continue;
            }

            let offset = 0;
            let hasInput = false;
            for (const element of row.elements) {
                if (isInputElement(element)) {
                    hasInput = true;
                    break;
                }
                offset += element.width;
            }
            if (!hasInput) {
                continue;
            }

            offsets.set(row, offset);
            widestOffset = Math.max(widestOffset, offset);
        }

        // A single socket is aligned with itself already.
        if (offsets.size < 2) {
            return;
        }

        let widestRow = 0;
        for (const row of this.rows) {
            const missingSpace = widestOffset - (offsets.get(row) ?? widestOffset);
            const spacer = 0 < missingSpace ? row.getFirstSpacer() : null;
            if (spacer) {
                spacer.width += missingSpace;
                row.width += missingSpace;
                row.widthWithConnectedBlocks += missingSpace;
            }
            widestRow = Math.max(widestRow, row.width);
        }

        this.width = Math.max(this.width, this.startX + widestRow);
    }
}

class AlignedZelosRenderer extends Blockly.zelos.Renderer {
    protected override makeRenderInfo_(block: Blockly.BlockSvg): Blockly.zelos.RenderInfo {
        return new AlignedRenderInfo(this, block);
    }
}

/** Makes {@link ALIGNED_ZELOS_RENDERER} available to `Blockly.inject`. */
export function registerAlignedZelosRenderer() {
    Blockly.blockRendering.register(ALIGNED_ZELOS_RENDERER, AlignedZelosRenderer);
}
