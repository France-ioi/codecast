export interface BlocklyBlock {
    RTL?: boolean,
    collapsed_?: boolean,
    colour_?: string,
    contextMenu?: boolean,
    deletable_?: boolean,
    disabled?: boolean,
    editable_?: boolean,
    id: string,
    inputList: BlocklyBlockInput[],
    movable_?: boolean,
    parentBlock_?: BlocklyBlock,
    type: string,
    getNextBlock: () => BlocklyBlock|null,
    getInputTargetBlock: (inputName: string) => BlocklyBlock,
    getFieldValue: (fieldName: string) => any,
}

export interface BlocklyBlockInput {
    name: string,
    connection: BlocklyConnection,
    fieldRow: {name: string, value_: string},
}

export interface BlocklyConnection {
    targetBlock: () => BlocklyBlock|null,
}
