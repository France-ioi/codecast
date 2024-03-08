import React, {useRef} from "react";
import {useAppSelector} from '../../../hooks';
import {HtmlLibState} from './html_lib';
import {selectAnswer} from '../../selectors';
import {documentToString} from '../../../buffers/document';

export function HtmlLibView() {
    const taskState: HtmlLibState = useAppSelector(state => state.task.state?.html);
    const answer = useAppSelector(selectAnswer);
    console.log('new answer', answer);

    if (!answer) {
        return null;
    }

    const html = documentToString(answer.document);

    return (
        <div className="html-lib-container" style={{width: 'calc(100% - 24px)', height: '100%', margin: '0 10px', border: 'solid 2px black'}}>
            <iframe
                style={{width: '100%', height: '100%'}}
                srcDoc={html}
            />
        </div>
    );
}
