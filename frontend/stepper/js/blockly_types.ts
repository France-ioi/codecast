export type HexColor = `#${string}`;

export interface BlocklyColours {
    categories: {[key: string]: number|HexColor};
    blocks: {[key: string]: number|HexColor};
}
