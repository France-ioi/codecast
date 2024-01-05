export enum BlockType {
    Function = 'function',
    Constant = 'constant',
    Token = 'token',
    Directive = 'directive',
}

export interface Block {
    name: string,
    type: BlockType,
    description?: string // displayed on the blocks list and in autocomplete
    code?: string, // code that will inserted by Codecast
    snippet?: string, // code that will be inserted by Ace editor
    caption?: string, // how the block will be displayed on the interface
    captionMeta?: string, // optional category that will appear in autocomplete
    category?: string,
    generatorName?: string,
    value?: string, // for constant
    paramsCount?: any,
    params?: string[], // for function
    showInBlocks?: boolean,
    returnType?: string,
}
