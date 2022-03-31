import React, {useEffect, useState} from "react";
import {Editor} from "./Editor";
import {ActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";
import {withResizeDetector} from "react-resize-detector/build/withPolyfill";
import {Block} from "../task/blocks/blocks";
import {CodecastPlatform} from "../store";
import {BlocklyEditor} from "../stepper/js/BlocklyEditor";

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
    platform?: CodecastPlatform,
}

const _BufferEditor = (props: BufferEditorProps) => {
    const {buffer, width, height, platform} = props;

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
        console.log('on init');
        dispatch({type: ActionTypes.BufferInit, buffer, editor})
    };

    const onSelect = (selection) => {
        dispatch({type: ActionTypes.BufferSelect, buffer, selection});
    };

    const onEdit = (delta) => {
        dispatch({type: ActionTypes.BufferEdit, buffer, delta});
    };

    const onEditPlain = (document) => {
        dispatch({type: ActionTypes.BufferEditPlain, buffer, document});
    };

    const onScroll = (firstVisibleRow) => {
        dispatch({type: ActionTypes.BufferScroll, buffer, firstVisibleRow});
    };

    const onDropBlock = (block: Block, pos) => {
        dispatch({type: ActionTypes.BufferInsertBlock, payload: {buffer, block, pos}});
    };

    if (CodecastPlatform.Blockly === platform) {
        return <BlocklyEditor
            onInit={onInit}
            onEditPlain={onEditPlain}
        />
    }

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
