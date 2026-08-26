// Ported from FioiBlockly's core/field_number.js override.

import * as Blockly from 'blockly/core';
import type {NumericKeypadOptions} from '../../../task/blocks/NumericKeypad';

/** Vertical distance between the top of the field editor and the keypad. */
const KEYPAD_MARGIN_TOP = 24;
/** Size of the keypad, used to keep it inside the window. */
const KEYPAD_WIDTH = 238;
const KEYPAD_HEIGHT = 270;

/**
 * Number field which is edited with the QuickAlgo keypad instead of the
 * keyboard, when the interface provides one.
 *
 * Blockly's own inline editor is still created, but without focus: it displays
 * the value while it is typed on the keypad, and keeps handling validation and
 * change events as usual.
 */
export class FieldNumberKeypad extends Blockly.FieldNumber {
    protected showEditor_(e?: Event, quietInput?: boolean, manageEphemeralFocus?: boolean) {
        const quickAlgoInterface = window.quickAlgoInterface;
        const useKeypad = !!quickAlgoInterface?.displayKeypad;

        // A quiet editor also avoids the mobile prompt, which would compete
        // with the keypad.
        super.showEditor_(e, quietInput || useKeypad, manageEphemeralFocus);

        if (!useKeypad) {
            return;
        }

        // The editor is positioned asynchronously (`resizeEditor_` waits for
        // the queued renders), so compute the position of the keypad from the
        // field itself rather than from the editor.
        const fieldBBox = this.getScaledBBox();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        const top = Math.min(Math.max(fieldBBox.top + KEYPAD_MARGIN_TOP, 0), windowHeight - KEYPAD_HEIGHT);
        const left = Math.min(Math.max(fieldBBox.left, 0), windowWidth - KEYPAD_WIDTH);

        const keypadOptions: NumericKeypadOptions = {
            minimum: this.getMin(),
            maximum: this.getMax(),
            precision: this.getPrecision(),
        };

        quickAlgoInterface.displayKeypad(
            this.getText(),
            {top: `${top}px`, left: `${left}px`},
            (value: number) => {
                this.setKeypadValue(value);
            },
            (value: number, validated: boolean) => {
                this.setKeypadValue(value);
                if (validated) {
                    // Closing the editor commits the value and fires a single
                    // change event for the whole edition.
                    Blockly.WidgetDiv.hide();
                    this.focusAfterKeypad();
                } else {
                    this.htmlInput_?.focus();
                    this.htmlInput_?.select();
                }
            },
            keypadOptions,
        );
    }

    /**
     * Puts the keyboard focus back on the field, once the keypad is gone.
     *
     * Deferred because none of that has happened yet: the modal is only told to
     * close once this returns, and lets the focus go once React has rendered it.
     */
    private focusAfterKeypad() {
        setTimeout(() => {
            if (this.getSourceBlock()?.isDeadOrDying()) {
                return;
            }

            Blockly.getFocusManager().focusNode(this);
        }, 0);
    }

    private setKeypadValue(value: number) {
        if (isNaN(value)) {
            return;
        }

        // Don't fire a change event for every key of the keypad, the editor
        // fires one for the whole edition when it closes. Unless it has been
        // closed meanwhile, in which case nothing would report the change.
        this.setEditorValue_(value, !this.isBeingEdited_);
    }
}

/**
 * Make the number fields (`field_number` in the blocks JSON definitions) use
 * the keypad. Doesn't affect the angle field, which is a `FieldNumber`
 * subclass registered under its own name.
 */
export function registerFieldNumberKeypad() {
    Blockly.registry.register(Blockly.registry.Type.FIELD, 'field_number', FieldNumberKeypad, true);
}
