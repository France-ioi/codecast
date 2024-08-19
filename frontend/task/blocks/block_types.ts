export enum BlockType {
    Function = 'function',
    ClassFunction = 'class_function',
    Constant = 'constant',
    ClassConstant = 'class_constant',
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
    paramsCount?: number[],
    params?: string[], // for function
    showInBlocks?: boolean,
    returnType?: string|boolean,
    methodName?: string,
    className?: string,
    classInstance?: string,
    placeholderClassInstance?: boolean, // if this is a placeholder class instance that we generate for the sole purpose of creating blocks for this class
}
