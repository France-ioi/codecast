import React, {useRef} from "react";
import {useAppSelector} from '../../../hooks';
import {HtmlLibState} from './html_lib';

export function HtmlLibView() {
    const taskState: HtmlLibState = useAppSelector(state => state.task.state?.html);
    const containerRef = useRef<HTMLDivElement>();

    return (
        <div className="debug-lib-container" ref={containerRef}>
            Preview
        </div>
    );
}
