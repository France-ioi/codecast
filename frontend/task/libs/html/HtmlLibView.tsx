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
    const buffers = useAppSelector(state => state.buffers.buffers);
    if (!context) {
        return null;
    }

    let html = 'source:0' in buffers ? documentToString(buffers['source:0'].document) : '';
    const css = 'source:1' in buffers ? context.html.convertBlocksIntoCss(buffers['source:1'].document) : '';

    html += `<style>
${css}
</style>`;

    return (
        <div className="html-lib-container" style={{width: 'calc(100% - 24px)', height: '100%', margin: '0 10px', border: 'solid 2px black'}}>
            <iframe
                style={{width: '100%', height: '100%'}}
                srcDoc={html}
            />
        </div>
    );
}
