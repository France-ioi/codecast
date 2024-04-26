import React, {useEffect, useRef} from "react";
import {useAppSelector} from '../../../hooks';
import {DebugLibState} from './debug_lib';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronRight} from '@fortawesome/free-solid-svg-icons/faChevronRight';

export function DebugLibView() {
    const taskState: DebugLibState = useAppSelector(state => state.task.state?.debug);
    const containerRef = useRef<HTMLDivElement>();

    useEffect(() => {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }, [taskState?.linesLogged]);

    if (!taskState?.linesLogged?.length) {
        return null;
    }

    return (
        <div className="debug-lib-container" ref={containerRef}>
            {taskState?.linesLogged.map((line, lineIndex) =>
                <div className="debug-lib-line" key={lineIndex}>
                    <FontAwesomeIcon icon={faChevronRight}/>
                    <span>{Array.isArray(line) ? `[${line.join(', ')}]` : line}</span>
                </div>
            )}
        </div>
    );
}
