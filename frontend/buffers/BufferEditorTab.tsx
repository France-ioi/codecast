import React from "react";
import {BufferState} from './buffer_types';
import {platformsList} from '../stepper/platforms';
import {useAppSelector} from '../hooks';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useDispatch} from 'react-redux';
import {bufferChangeActiveBufferName, bufferRemove} from './buffers_slice';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

export interface BufferEditorTabProps {
    bufferName: string,
    buffer: BufferState,
}

export function BufferEditorTab(props: BufferEditorTabProps) {
    const {buffer, bufferName} = props;
    const fileName = `${buffer.fileName}.${platformsList[buffer.platform].extension}`;
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);
    const isActive = activeBufferName === bufferName;
    const dispatch = useDispatch();

    const changeTab = () => {
        dispatch(bufferChangeActiveBufferName(bufferName));
    };

    const closeTab = (e) => {
        e.stopPropagation();
        dispatch(bufferRemove(bufferName));
    };

    return (
        <div className={`layout-editor-tab ${isActive ? 'is-active' : ''}`} onClick={changeTab}>
            {fileName}
            {/*{isActive && <FontAwesomeIcon icon={faPen} className="ml-1"/>}*/}
            <div className="layout-editor-tab-close" onClick={closeTab}>
                <FontAwesomeIcon icon={faTimes}/>
            </div>
        </div>
    );
}
