import React from "react";
import {useAppSelector} from '../../../hooks';
import {HtmlLib, HtmlLibState} from './html_lib';
import {selectAnswer} from '../../selectors';
import {BlockDocument, BufferType} from '../../../buffers/buffer_types';
import {quickAlgoLibraries} from '../quick_algo_libraries_model';
import {documentToString} from '../../../buffers/document';

export function HtmlLibView() {
    const taskState: HtmlLibState = useAppSelector(state => state.task.state?.html);
    const context = quickAlgoLibraries.getContext(null, 'main') as HtmlLib;
    const answer = useAppSelector(selectAnswer);
    console.log('new answer', answer, context.html);

    if (!answer || !context) {
        return null;
    }

    let css = '';
    let html = '';
    if (answer.document.type === BufferType.Block) {
        css = context.html.convertBlocksIntoCss(answer.document as BlockDocument);

        html = `<html>
<head>
<style>
${css}
</style>
</head>
<body>
<div class="classname">test</div>
</body>
</html>`;
    } else {
        html = documentToString(answer.document);
    }

    return (
        <div className="html-lib-container" style={{width: 'calc(100% - 24px)', height: '100%', margin: '0 10px', border: 'solid 2px black'}}>
            <iframe
                style={{width: '100%', height: '100%'}}
                srcDoc={html}
            />
        </div>
    );
}
