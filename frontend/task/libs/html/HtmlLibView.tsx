import React from "react";
import {useAppSelector} from '../../../hooks';
import {HtmlLib} from './html_lib';
import {quickAlgoLibraries} from '../quick_algo_libraries_model';
import {documentToString} from '../../../buffers/document';

export function HtmlLibView() {
    const context = quickAlgoLibraries.getContext(null, 'main') as HtmlLib;
    const buffers = useAppSelector(state => state.buffers.buffers);
    if (!context) {
        return null;
    }

    let html = 'source:0' in buffers ? documentToString(buffers['source:0'].document) : '';
    const css = 'source:1' in buffers ? context.html.convertBlocksIntoCss(buffers['source:1'].document) : '';
    const js = 'source:2' in buffers ? context.html.convertBlocksIntoJs(buffers['source:2'].document) : '';

    html += `<style>
${css}
</style>
<script>
${js}
</script>`;

    return (
        <div className="html-lib-container" style={{width: 'calc(100% - 24px)', height: '100%', margin: '0 10px', border: 'solid 2px black'}}>
            <iframe
                style={{width: '100%', height: '100%'}}
                srcDoc={html}
            />
        </div>
    );
}
