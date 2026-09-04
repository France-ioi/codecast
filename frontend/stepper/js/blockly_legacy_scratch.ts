// Answers saved by the previous Blockly version, in Scratch mode, are written in
// the scratch-blocks vocabulary: `control_repeat`, `operator_add`,
// `data_setvariableto`… The current Scratch mode is the standard Blockly blocks
// drawn by the Zelos renderer, so none of those types exist any more and Blockly
// throws on the first one it meets while loading the workspace, losing the whole
// answer.
//
// This rewrites them into their current equivalent: the block type, its inputs
// and its fields, plus the surrounding blocks when the two shapes don't match
// (a Scratch variable is a block plugged into an input where Blockly has a
// field, `data_listrepeat` is one block where Blockly needs two).
//
// Kept free of any Blockly import: it is called from the platform saga, on
// answers of tasks that may not even be block-based.

/** Enough to tell a legacy answer from a current one without parsing it. */
const LEGACY_TYPE_MARKER = /<(?:block|shadow)[^>]+type="(?:control|data|operator)_/;

/** Name of the field a scratch-blocks variable or list menu holds. */
const LEGACY_VARIABLE_FIELD = 'VARIABLE';

type LegacyBlockConverter = (block: Element) => void;

/**
 * How each legacy block type becomes a current one. Every converter receives the
 * block element, its children already converted, and rewrites it in place.
 */
const legacyBlockConverters: {[legacyType: string]: LegacyBlockConverter} = {
    // Control: Scratch names its loop body SUBSTACK and its condition CONDITION.
    control_if: (block) => {
        setType(block, 'controls_if');
        renameInput(block, 'CONDITION', 'IF0');
        renameInput(block, 'SUBSTACK', 'DO0');
    },
    control_if_else: (block) => {
        setType(block, 'controls_if');
        // `controls_if` grows its else branch through its mutator.
        setMutation(block, {else: '1'});
        renameInput(block, 'CONDITION', 'IF0');
        renameInput(block, 'SUBSTACK', 'DO0');
        renameInput(block, 'SUBSTACK2', 'ELSE');
    },
    control_repeat: (block) => {
        // The count is an input, so this is the `_ext` variant of the repeat block.
        setType(block, 'controls_repeat_ext');
        renameInput(block, 'SUBSTACK', 'DO');
        makeInputNumeric(block, 'TIMES');
    },
    control_repeat_until: (block) => {
        // `controls_untilWhile` is the same block as `controls_whileUntil`; only
        // its MODE tells them apart, and Scratch only ever repeats *until*.
        setType(block, 'controls_untilWhile');
        setField(block, 'MODE', 'UNTIL');
        renameInput(block, 'CONDITION', 'BOOL');
        renameInput(block, 'SUBSTACK', 'DO');
    },
    control_forever: (block) => {
        setType(block, 'controls_infiniteloop');
        renameInput(block, 'SUBSTACK', 'inner_blocks');
    },

    // Data: Scratch plugs a variable menu into an input, Blockly has a field.
    data_variable: (block) => {
        setType(block, 'variables_get');
        moveVariableInputToField(block, LEGACY_VARIABLE_FIELD, 'VAR');
    },
    data_setvariableto: (block) => {
        setType(block, 'variables_set');
        moveVariableInputToField(block, LEGACY_VARIABLE_FIELD, 'VAR');
    },
    data_changevariableby: (block) => {
        setType(block, 'math_change');
        moveVariableInputToField(block, LEGACY_VARIABLE_FIELD, 'VAR');
        renameInput(block, 'VALUE', 'DELTA');
        makeInputNumeric(block, 'DELTA');
    },
    data_itemoflist: (block) => {
        setType(block, 'lists_getIndex');
        // The list is a field here and a plugged-in `variables_get` there.
        replaceVariableFieldWithGetter(block, 'LIST', 'VALUE');
        renameInput(block, 'INDEX', 'AT');
        makeInputNumeric(block, 'AT');
        setField(block, 'MODE', 'GET');
        setField(block, 'WHERE', 'FROM_START');
    },
    data_replaceitemoflist: (block) => {
        setType(block, 'lists_setIndex');
        replaceVariableFieldWithGetter(block, 'LIST', 'LIST');
        renameInput(block, 'INDEX', 'AT');
        makeInputNumeric(block, 'AT');
        renameInput(block, 'ITEM', 'TO');
        setField(block, 'MODE', 'SET');
        setField(block, 'WHERE', 'FROM_START');
    },
    data_listrepeat: (block) => {
        // `LIST = [ITEM] * TIMES` as one statement in Scratch, but `lists_repeat`
        // only builds the list: it takes a `variables_set` around it.
        const listRepeat = createElement(block, 'block');
        listRepeat.setAttribute('type', 'lists_repeat');
        moveInput(block, 'ITEM', listRepeat, 'ITEM');
        moveInput(block, 'TIMES', listRepeat, 'NUM');
        makeInputNumeric(listRepeat, 'NUM');

        setType(block, 'variables_set');
        renameField(block, 'LIST', 'VAR');
        const value = createElement(block, 'value');
        value.setAttribute('name', 'VALUE');
        value.appendChild(listRepeat);
        insertBeforeNext(block, value);
    },

    // Operators.
    operator_add: (block) => convertArithmetic(block, 'ADD'),
    operator_subtract: (block) => convertArithmetic(block, 'MINUS'),
    operator_multiply: (block) => convertArithmetic(block, 'MULTIPLY'),
    operator_divide: (block) => convertArithmetic(block, 'DIVIDE'),
    operator_dividefloor: (block) => convertArithmetic(block, 'DIVIDEFLOOR'),
    operator_equals: (block) => convertComparison(block, 'EQ'),
    operator_gt: (block) => convertComparison(block, 'GT'),
    operator_gte: (block) => convertComparison(block, 'GTE'),
    operator_lt: (block) => convertComparison(block, 'LT'),
    operator_lte: (block) => convertComparison(block, 'LTE'),
    operator_and: (block) => convertLogicOperation(block, 'AND'),
    operator_or: (block) => convertLogicOperation(block, 'OR'),
    operator_not: (block) => {
        setType(block, 'logic_negate');
        renameInput(block, 'OPERAND', 'BOOL');
    },
    operator_join: (block) => {
        setType(block, 'text_join');
        setMutation(block, {items: '2'});
        renameInput(block, 'STRING1', 'ADD0');
        renameInput(block, 'STRING2', 'ADD1');
    },
};

function convertArithmetic(block: Element, operator: string) {
    setType(block, 'math_arithmetic');
    setField(block, 'OP', operator);
    renameInput(block, 'NUM1', 'A');
    renameInput(block, 'NUM2', 'B');
    makeInputNumeric(block, 'A');
    makeInputNumeric(block, 'B');
}

function convertComparison(block: Element, operator: string) {
    setType(block, 'logic_compare');
    setField(block, 'OP', operator);
    renameInput(block, 'OPERAND1', 'A');
    renameInput(block, 'OPERAND2', 'B');
}

function convertLogicOperation(block: Element, operator: string) {
    setType(block, 'logic_operation');
    setField(block, 'OP', operator);
    renameInput(block, 'OPERAND1', 'A');
    renameInput(block, 'OPERAND2', 'B');
}

/**
 * Rewrites the blocks of an answer saved by the Scratch mode of the previous
 * Blockly version. Anything else — a current answer, a Blockly-mode answer, a
 * document that isn't XML — is returned untouched.
 */
export function convertLegacyScratchXml(xml: string): string {
    if (!xml || !LEGACY_TYPE_MARKER.test(xml)) {
        return xml;
    }

    const dom = new DOMParser().parseFromString(xml, 'text/xml');
    // Leave a malformed answer alone rather than serializing an error document:
    // Blockly reports it better than we would.
    if (!dom.documentElement || dom.getElementsByTagName('parsererror').length) {
        return xml;
    }

    convertElement(dom.documentElement);

    return new XMLSerializer().serializeToString(dom);
}

/** Converts a block and everything under it, innermost blocks first. */
function convertElement(element: Element) {
    for (const child of childElements(element)) {
        convertElement(child);
    }

    const tagName = element.nodeName.toLowerCase();
    if ('block' !== tagName && 'shadow' !== tagName) {
        return;
    }

    const converter = legacyBlockConverters[element.getAttribute('type')];
    if (converter) {
        converter(element);
    }
}

function childElements(element: Element): Element[] {
    const children: Element[] = [];
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];
        if (child.nodeType === 1 /* ELEMENT_NODE */) {
            children.push(child as Element);
        }
    }

    return children;
}

function createElement(sibling: Element, tagName: string): Element {
    // Same namespace as the rest of the document, so that serializing back
    // doesn't sprinkle `xmlns=""` over the blocks we create.
    return sibling.namespaceURI
        ? sibling.ownerDocument.createElementNS(sibling.namespaceURI, tagName)
        : sibling.ownerDocument.createElement(tagName);
}

function setType(block: Element, type: string) {
    block.setAttribute('type', type);
}

/** The `<value>` or `<statement>` of the block itself, not of a block inside it. */
function findInput(block: Element, name: string): Element|null {
    return childElements(block).find(child => {
        const tagName = child.nodeName.toLowerCase();

        return ('value' === tagName || 'statement' === tagName) && name === child.getAttribute('name');
    }) ?? null;
}

function findField(block: Element, name: string): Element|null {
    return childElements(block).find(child => {
        return 'field' === child.nodeName.toLowerCase() && name === child.getAttribute('name');
    }) ?? null;
}

function renameInput(block: Element, from: string, to: string) {
    findInput(block, from)?.setAttribute('name', to);
}

function renameField(block: Element, from: string, to: string) {
    findField(block, from)?.setAttribute('name', to);
}

/** Moves an input of a block, under its new name, into another block. */
function moveInput(block: Element, from: string, target: Element, to: string) {
    const input = findInput(block, from);
    if (!input) {
        return;
    }

    input.setAttribute('name', to);
    target.appendChild(input);
}

function setField(block: Element, name: string, value: string) {
    const existing = findField(block, name);
    if (existing) {
        existing.textContent = value;

        return;
    }

    const field = createElement(block, 'field');
    field.setAttribute('name', name);
    field.textContent = value;
    block.insertBefore(field, block.firstChild);
}

function setMutation(block: Element, attributes: {[name: string]: string}) {
    const mutation = createElement(block, 'mutation');
    for (let [name, value] of Object.entries(attributes)) {
        mutation.setAttribute(name, value);
    }

    // Blockly applies the mutation before the fields and the inputs whatever its
    // position, but keeping it first is what its own serializer writes.
    block.insertBefore(mutation, block.firstChild);
}

/** Inserts a node into a block, before the block chained after it if any. */
function insertBeforeNext(block: Element, node: Element) {
    const next = childElements(block).find(child => 'next' === child.nodeName.toLowerCase());
    block.insertBefore(node, next ?? null);
}

/**
 * Turns the Scratch variable menu plugged into an input into the field the
 * Blockly block holds the variable in.
 */
function moveVariableInputToField(block: Element, inputName: string, fieldName: string) {
    const input = findInput(block, inputName);
    if (!input) {
        return;
    }

    const name = findVariableName(input);
    if (null !== name) {
        setField(block, fieldName, name);
    }

    block.removeChild(input);
}

/**
 * Turns the variable field naming the list into the `variables_get` block the
 * Blockly list blocks take the list from.
 */
function replaceVariableFieldWithGetter(block: Element, fieldName: string, inputName: string) {
    const field = findField(block, fieldName);
    if (!field) {
        return;
    }

    const getter = createElement(block, 'block');
    getter.setAttribute('type', 'variables_get');
    const variable = createElement(block, 'field');
    variable.setAttribute('name', 'VAR');
    variable.textContent = field.textContent;
    getter.appendChild(variable);

    const input = createElement(block, 'value');
    input.setAttribute('name', inputName);
    input.appendChild(getter);

    block.removeChild(field);
    insertBeforeNext(block, input);
}

/** The variable a scratch-blocks variable or list menu names, at any depth. */
function findVariableName(element: Element): string|null {
    for (const child of childElements(element)) {
        if ('field' === child.nodeName.toLowerCase() && LEGACY_VARIABLE_FIELD === child.getAttribute('name')) {
            return child.textContent;
        }

        const name = findVariableName(child);
        if (null !== name) {
            return name;
        }
    }

    return null;
}

/**
 * Replaces the text shadow Scratch leaves in an input by a number one, for the
 * inputs the Blockly block only accepts numbers in — Blockly refuses to connect
 * the others, which would again cost the whole answer.
 */
function makeInputNumeric(block: Element, inputName: string) {
    const input = findInput(block, inputName);
    if (!input) {
        return;
    }

    for (const child of childElements(input)) {
        if ('shadow' !== child.nodeName.toLowerCase() || 'text' !== child.getAttribute('type')) {
            continue;
        }

        child.setAttribute('type', 'math_number');
        renameField(child, 'TEXT', 'NUM');
        const value = findField(child, 'NUM');
        // A number field can't be left empty, and Scratch wrote free text in there.
        if (value && !/^-?\d*\.?\d+$/.test(value.textContent.trim())) {
            value.textContent = '0';
        }
    }
}
