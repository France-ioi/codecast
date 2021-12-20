import React, {useEffect, useState} from "react";
import {Editor} from "./Editor";
import {ActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";
import {useResizeDetector} from "react-resize-detector";
import {withResizeDetector} from "react-resize-detector/build/withPolyfill";
import {Block, BlockType} from "../task/blocks/blocks";

interface BufferEditorProps {
    readOnly?: boolean,
    shield?: boolean,
    theme?: string,
    mode: string,
    requiredWidth: any,
    requiredHeight: any,
    width?: number,
    height?: number,
    buffer: any,
    hasAutocompletion?: boolean,
}

const _BufferEditor = (props: BufferEditorProps) => {
    const {buffer, width, height} = props;

    const [prevWidth, setPrevWidth] = useState(0);
    const [prevHeight, setPrevHeight] = useState(0);

    const dispatch = useDispatch();

    useEffect(() => {
        if ((width !== prevWidth || height !== prevHeight) && width && height) {
            dispatch({type: ActionTypes.BufferResize, buffer});
        }
        setPrevWidth(width);
        setPrevHeight(height);
    }, [props.width, props.height])

    const onInit = (editor) => {
        dispatch({type: ActionTypes.BufferInit, buffer, editor})
    };

    const onSelect = (selection) => {
        dispatch({type: ActionTypes.BufferSelect, buffer, selection});
    };

    const onEdit = (delta) => {
        dispatch({type: ActionTypes.BufferEdit, buffer, delta});
    };

    const onScroll = (firstVisibleRow) => {
        dispatch({type: ActionTypes.BufferScroll, buffer, firstVisibleRow});
    };

    const onDropBlock = (block: Block, pos) => {
        dispatch({type: ActionTypes.BufferInsertBlock, payload: {buffer, block, pos}});
    };

    return <Editor
        onInit={onInit}
        onEdit={onEdit}
        onSelect={onSelect}
        onScroll={onScroll}
        onDropBlock={onDropBlock}
        readOnly={props.readOnly}
        shield={props.shield}
        theme={props.theme}
        mode={props.mode}
        width={props.requiredWidth}
        height={props.requiredHeight}
        hasAutocompletion={props.hasAutocompletion}
    />;
}

export const BufferEditor = withResizeDetector(_BufferEditor);
