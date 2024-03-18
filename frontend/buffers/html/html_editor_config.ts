import {v4 as uuidv4} from 'uuid'
import {DraggableStateSnapshot, DraggingStyle, NotDraggingStyle} from 'react-beautiful-dnd';
import {memoize} from 'proxy-memoize';

export interface ToolboxCategoryBlocks {
    id: number,
    tag: string,
    paired: boolean,
    desc?: string,
}

export interface ToolboxCategory {
    id: number,
    name: string,
    highlight: string,
    blocks: ToolboxCategoryBlocks[],
    openDesc?: ToolboxCategoryBlocks["id"] | null
}

export interface ToolboxConfiguration {
    categories: ToolboxCategory[]
}

// Set default editor mode (visual or textual)
export const initialMode = 'visual'
// Allow user to switch editor modes
export const allowModeSwitch: boolean = true

// =============================SET DEFAULT HTML CODE HERE============================================================
export const initialCode = "<body>" +
    "<div>" +
    "<h1>" +
    "Example Domain" +
    "</h1>" +
    "<p>This domain is for use in illustrative examples in documents. " +
    "You may use this domain in literature without prior coordination or asking for permission.</p>" +
    "<p>More <i>information</i>...</p>" +
    "<span><?i>Hello world</?i></span>" +
    "<p>Hello!</p>" +
    "</div>" +
    "</body>"
// ===================================================================================================================

// =============================SET AVAILABLE TOOLBOX CATEGORIES & BLOCKS HERE========================================
// Each category has id (manually increment for now)
// Name of category
// Color of category for side bar style
// Blocks contained within category
// Blocks have id (manually increment for now)
// Tag (actual HTML tag value)
// Paired (whether the tag is self-closing or paired with a closing tag
// Desc (block description)
export const tbConf: ToolboxConfiguration = {
    categories: [
        {
            id: 1,
            name: 'Blocs',
            highlight: '#4a90e2',
            blocks: [
                {
                    id: 1,
                    tag: 'div',
                    paired: true,
                },
                {
                    id: 2,
                    tag: 'h1',
                    paired: true,
                },
                {
                    id: 3,
                    tag: 'p',
                    paired: true,
                    desc: 'Un paragraphe'
                },
                {
                    id: 4,
                    tag: 'ul',
                    paired: true,
                    desc: "Une liste d'items",
                },
                {
                    id: 5,
                    tag: 'li',
                    paired: true,
                    desc: "Un item d'une liste",
                }
            ]
        },
        {
            id: 2,
            name: 'Formulaires',
            highlight: '#b8e986',
            blocks: [
                {
                    id: 6,
                    tag: 'form',
                    paired: true,
                },
                {
                    id: 7,
                    tag: 'input',
                    paired: false,
                },
                {
                    id: 8,
                    tag: 'label',
                    paired: true,
                },
                {
                    id: 9,
                    tag: 'select',
                    paired: true,
                },
                {
                    id: 10,
                    tag: 'button',
                    paired: true,
                },
                {
                    id: 11,
                    tag: 'textarea',
                    paired: true,
                }
            ]
        },
        {
            id: 3,
            name: 'En ligne',
            highlight: '#4a51e2',
            blocks: [
                {
                    id: 12,
                    tag: 'span',
                    paired: true,
                },
                {
                    id: 13,
                    tag: 'i',
                    paired: true,
                },
                {
                    id: 14,
                    tag: 'b',
                    paired: true,
                }
            ]
        },
        {
            id: 4,
            name: 'Divers',
            highlight: '#c346f0',
            blocks: [
                {
                    id: 15,
                    tag: 'script',
                    paired: true,
                },
                {
                    id: 16,
                    tag: 'article',
                    paired: true,
                },
                {
                    id: 17,
                    tag: 'canvas',
                    paired: true,
                },
                {
                    id: 18,
                    tag: 'nav',
                    paired: true,
                }
            ]
        }
    ]
}
// ===================================================================================================================

export enum TagType {
    Opening = 'opening',
    Closing = 'closing',
    Text = 'text'
}

export enum EditorType {
    Textual = 'textual',
    Visual = 'visual'
}

export interface CodeSegment {
    id: string,
    type: TagType,
    value: string,
    unlocked: boolean,
    index?: number,
    htmlAttributes?: {[attribute: string]: string},
}

export type CodeSegments = Array<CodeSegment>

export const getDisplayedTag = (tag: CodeSegment) => {
    if (TagType.Text === tag.type) {
        return tag.value + ' ';
    }

    if (TagType.Closing === tag.type){
        return `</${tag.value}>`;
    }

    const attributes = tag.htmlAttributes ? Object.entries(tag.htmlAttributes).map(([name, value]) => {
        return `${name}="${value}"`;
    }).join(' ') : null;

    return `<${tag.value}${attributes ? ' ' + attributes : ''}>`;
}

const selfClosingTags = [
    'area', 'base', 'br', 'col', 'embed', 'hr',
    'img', 'link', 'meta', 'param', 'source'
];

export function getCodeSegmentClasses(element: CodeSegment) {
    let classes: string = element.unlocked ? 'unlocked ' : 'locked '
    if (element.type !== 'text') {
        selfClosingTags.includes(element.value) ?
            classes += 'self-closing '
            :
            classes += element.type === 'opening' ? 'opening ' : 'closing '
    } else {
        classes += 'text '
    }

    return classes;
}

export function htmlSegment(html: string, unlockAll: boolean) {
    let editorCode: CodeSegments = []
    let trimmed = html.trim()
    const reg = /<([^/][^>]*?)>|<\/(.+?)>|([^<>\s][a-zA-Z.!]*)/g
    const matches = trimmed.matchAll(reg)

    for (const m of matches) {
        if (m[1] !== undefined) { // 1st bounding group, opening tags
            const attributeRegex = /([^\s]+)="([^"]*)"/g;
            let match;
            const attributes = {};
            while ((match = attributeRegex.exec(m[1])) !== null) {
                attributes[match[1]] = match[2];
            }

            editorCode.push({
                id: uuidv4(),
                type: TagType.Opening,
                value: m[1].replace('?', '').split(' ')[0],
                unlocked: m[1].charAt(0) === '?' || unlockAll,
                htmlAttributes: attributes,
            })
        } else if (m[2] !== undefined) { // 2nd bounding group, closing tags
            editorCode.push({
                id: uuidv4(),
                type: TagType.Closing,
                value: m[2].replace('?', ''),
                unlocked: m[2].charAt(0) === '?' || unlockAll
            })
        } else if (m[3] !== undefined) { // 3rd bounding group, text
            editorCode.push({
                id: uuidv4(),
                type: TagType.Text,
                value: m[3],
                unlocked: false
            })
        }
    }

    return editorCode
}

export const htmlSegmentMemoize = memoize((element: {html: string}) => htmlSegment(element.html, true));

const beautifyHTML = require('js-beautify').html

export function parseHTMLToString(elements: CodeSegments | string) {
    let stringedHTML = '';

    if (typeof elements !== 'string') {
        for (let index = 0; index < elements.length; index++) {
            const e = elements[index];
            if (
                (e.value === 'p' && e.type === TagType.Closing)
                || (selfClosingTags.includes(e.value) && elements[index - 1]?.value !== 'p')
            ) {
                stringedHTML += '\n';
            }
            stringedHTML += getDisplayedTag(e);
            if (
                e.value === 'p'
                || (selfClosingTags.includes(e.value) && elements[index + 1]?.value !== 'p')
            ) {
                stringedHTML += '\n';
            }
        }
    }

    return beautifyHTML(stringedHTML, {wrap_line_length: 0, preserve_newlines: true})
}


// Used to cancel transition animation for certain draggables
export function getDragStyle(style: DraggingStyle | NotDraggingStyle | undefined, snapshot: DraggableStateSnapshot) {
    if (!snapshot.isDropAnimating) {
        return style
    }
    if (snapshot.draggingOver === 'toolbox-dropzone') {
        return {
            ...style,
            transitionDuration: `0.001s`,
        }
    }
    return style
}

export function isTouchDevice() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
    // @ts-ignore
        (navigator.msMaxTouchPoints > 0));
}
