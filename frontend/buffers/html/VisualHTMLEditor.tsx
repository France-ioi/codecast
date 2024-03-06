import React from "react";
import {CodeSegments, TagType} from "./html_editor_config"
import {VisualHTMLEditorLineCounter} from './VisualHTMLEditorLineCounter';
import {VisualHTMLEditorLine} from './VisualHTMLEditorLine';

interface VisualHTMLEditorProps {
    elements: CodeSegments
}

type TLine = {
    lineContents: CodeSegments,
    lineIndentation: number
}

export function VisualHTMLEditor(props: VisualHTMLEditorProps) {
    let indentCounter = 0
    let lineBuilder: CodeSegments = []
    let lines: Array<TLine> = []

    function identifyBlockType(tag: string) { // Identify block type to determine linebreaks
        tag = tag.split(" ")[0]! // In case tag has attributes, isolate first word (tag name)
        const block = [
            'div', 'footer', 'form', 'header', 'li', 'main', 'nav',
            'ol', 'ul', 'pre', 'section', 'table', 'video', 'body',
            'head', '!doctype html', 'textarea', 'p'
        ]
        const selfClosingBlock = [
            'hr', 'br'
        ]
        const inlineBlock = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
        ]

        if (block.includes(tag)) return 'block'
        else if (selfClosingBlock.includes(tag)) return 'self-closing'
        else if (inlineBlock.includes(tag)) return 'inline-block'
        else return 'inline'
    }

    props.elements.forEach((e, index) => {
        const blockType = identifyBlockType(e.value)
        if (blockType === 'block') {
            // If elements remain in lineBuilder, push them as new line before making current block's line
            if (lineBuilder.length > 0) {
                lines.push({lineContents: lineBuilder, lineIndentation: indentCounter})
                lineBuilder = []
            }
            // Indent & build new line for element
            if (e.type === TagType.Closing) indentCounter--
            lineBuilder.push({...e, index: index})
            lines.push({lineContents: lineBuilder, lineIndentation: indentCounter})
            lineBuilder = []
            if (e.type === TagType.Opening) indentCounter++
        } else if (blockType === 'self-closing') {
            // If elements remain in lineBuilder, push them as new line before making current block's line
            if (lineBuilder.length > 0) {
                lines.push({lineContents: lineBuilder, lineIndentation: indentCounter})
                lineBuilder = []
            }
            // Build new line for element
            lineBuilder.push({...e, index: index})
            lines.push({lineContents: lineBuilder, lineIndentation: indentCounter})
            lineBuilder = []
        } else if (blockType === 'inline-block') {
            // If elements in lineBuilder & curr = opening tag, push them as new line
            if (lineBuilder.length > 0 && e.type === TagType.Opening) {
                lines.push({lineContents: lineBuilder, lineIndentation: indentCounter})
                lineBuilder = []
            }
            lineBuilder.push({...e, index: index})
            // If closing inline-block tag, finish this line and push it to lines
            if (e.type === TagType.Closing) {
                lines.push({lineContents: lineBuilder, lineIndentation: indentCounter})
                lineBuilder = []
            }
        } else {
            lineBuilder.push({...e, index: index})
        }
    })

    const styles = {
        width: lines.length <= 9 ? '41px' : '49px'
    }

    return (
        <div className={'visual-html-editor'}>
            <div className={'lines-counter'} style={styles}>
                <VisualHTMLEditorLineCounter lineCount={lines.length}/>
            </div>
            <div className={'lines-container'}>
                {
                    lines.map(line => {
                        const keyGen = line.lineContents.map(e => e.id).join();

                        return <VisualHTMLEditorLine
                            id={'line-' + keyGen}
                            key={keyGen}
                            lineContents={line.lineContents}
                            indent={line.lineIndentation}
                        />
                    })
                }
            </div>
        </div>
    )
}

