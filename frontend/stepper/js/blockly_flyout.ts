// Flyouts (the panel the toolbox opens to show blocks) sized to our taste rather
// than to their contents: Blockly widens a vertical flyout until its widest block
// fits, which on a task with long block labels eats the workspace. We cap the width
// and let the blocks — at their normal size — scroll sideways instead.

import * as Blockly from 'blockly/core';
import {ContinuousFlyout} from '@blockly/continuous-toolbox';

/** How wide the flyout may get, in screen pixels, scrollbar included. */
const MAX_FLYOUT_WIDTH = 250;

/** Vertical space between two blocks of the flyout, in workspace units. */
const BLOCK_GAP = 12;

/**
 * Tightens the space Blockly leaves between two flyout items. The base class derives
 * `GAP_Y` from `MARGIN` in its constructor, which also sets the flyout's padding — this
 * is the gap alone. It is the default handed to every inflater's `gapForItem`, so a
 * toolbox entry with an explicit `gap` still wins.
 */
function setBlockGap(flyout: Blockly.Flyout) {
    (flyout as unknown as {GAP_Y: number}).GAP_Y = BLOCK_GAP;
}

/**
 * Gives the flyout's workspace a horizontal scrollbar on top of its vertical one.
 *
 * Blockly only ever builds the scrollbar of the axis a flyout scrolls along — a vertical
 * flyout gets a vertical one — because it otherwise grows to fit its widest block and so
 * never overflows sideways. Ours does. `positionAt_` already keeps both scrollbars of a
 * pair in place, and the flyout root is an `<svg>` element, so its own viewport clips
 * whatever scrolls out of view.
 */
function addHorizontalScrollbar(flyout: Blockly.Flyout) {
    const workspace = flyout.getWorkspace();
    workspace.scrollbar?.dispose();
    workspace.scrollbar = new Blockly.ScrollbarPair(
        workspace,
        true,
        true,
        'blocklyFlyoutScrollbar',
        flyout.SCROLLBAR_MARGIN,
    );
}

/**
 * Scrolls the flyout's workspace horizontally as well as vertically.
 *
 * `VerticalFlyout` only reads the vertical ratio, since that is the only scrollbar it
 * expects to have; this is its own implementation with the horizontal half of
 * `HorizontalFlyout`'s added to it.
 */
function scrollFlyoutTo(flyout: Blockly.Flyout, xyRatio: {x?: number, y?: number}) {
    if (!flyout.isVisible()) {
        return;
    }

    const workspace = flyout.getWorkspace();
    const metricsManager = workspace.getMetricsManager();
    const scrollMetrics = metricsManager.getScrollMetrics();
    const viewMetrics = metricsManager.getViewMetrics();
    const absoluteMetrics = metricsManager.getAbsoluteMetrics();

    if ('number' === typeof xyRatio.x) {
        workspace.scrollX = -(scrollMetrics.left + (scrollMetrics.width - viewMetrics.width) * xyRatio.x);
    }
    if ('number' === typeof xyRatio.y) {
        workspace.scrollY = -(scrollMetrics.top + (scrollMetrics.height - viewMetrics.height) * xyRatio.y);
    }

    workspace.translate(workspace.scrollX + absoluteMetrics.left, workspace.scrollY + absoluteMetrics.top);
}

/** The flyout of a regular Blockly workspace, category-based toolbox or not. */
export class MaxWidthVerticalFlyout extends Blockly.VerticalFlyout {
    constructor(workspaceOptions: Blockly.Options) {
        super(workspaceOptions);
        setBlockGap(this);
    }

    override init(targetWorkspace: Blockly.WorkspaceSvg) {
        super.init(targetWorkspace);
        addHorizontalScrollbar(this);
    }

    protected override setMetrics_(xyRatio: {x?: number, y?: number}) {
        scrollFlyoutTo(this, xyRatio);
    }

    protected override reflowInternal_() {
        super.reflowInternal_();
        // `super` has just sized the flyout to its widest block and laid everything out
        // for that width. Bring it back to the cap and let it lay out again.
        if (this.width_ > MAX_FLYOUT_WIDTH) {
            this.width_ = MAX_FLYOUT_WIDTH;
            this.position();
            this.targetWorkspace.resizeContents();
        }
    }
}

/** The same, for the continuous flyout Scratch mode uses. */
export class MaxWidthContinuousFlyout extends ContinuousFlyout {
    constructor(workspaceOptions: Blockly.Options) {
        super(workspaceOptions);
        setBlockGap(this);
    }

    override init(targetWorkspace: Blockly.WorkspaceSvg) {
        super.init(targetWorkspace);
        addHorizontalScrollbar(this);
    }

    protected override setMetrics_(xyRatio: {x?: number, y?: number}) {
        scrollFlyoutTo(this, xyRatio);
    }

    protected override reflowInternal_() {
        super.reflowInternal_();
        if (this.width_ > MAX_FLYOUT_WIDTH) {
            this.width_ = MAX_FLYOUT_WIDTH;
            this.position();
            this.targetWorkspace.resizeContents();
        }
    }
}
