import React, {useCallback, useEffect, useState} from "react";
import {Editor, EditorProps} from "./Editor";
import {useDispatch} from "react-redux";
import {withResizeDetector} from "react-resize-detector";
import {BlocklyEditor} from "../stepper/js/BlocklyEditor";
import {CodecastPlatform} from '../stepper/codecast_platform';
import {Block} from '../task/blocks/block_types';
import {
    bufferEdit,
    bufferEditPlain, bufferInit,
    bufferInsertBlock,
    bufferResize,
    bufferScrollToLine,
    bufferSelect
} from './buffers_slice';
import {
    BlockBufferState,
    BufferType,
    Document,
    Range,
    TextBufferState,
    TextDocumentDelta,
    TextPosition
} from './buffer_types';
import {useAppSelector} from '../hooks';
import {getComputedSourceHighlightFromStateSelector} from '../stepper';
import {createEmptyBufferState} from './document';

interface BufferEditorProps {
    readOnly?: boolean,
    shield?: boolean,
    theme?: string,
    mode: string,
    requiredWidth: any,
    requiredHeight: any,
    width?: number,
    height?: number,
    bufferName: string,
    hasAutocompletion?: boolean,
    platform?: CodecastPlatform,
    dragEnabled?: boolean,
    editorProps?: EditorProps,
}

const _BufferEditor = (props: BufferEditorProps) => {
    const {bufferName, width, height} = props;
    const bufferState = useAppSelector(state => state.buffers.buffers[bufferName] ? state.buffers.buffers[bufferName] : createEmptyBufferState(BufferType.Text));
    const bufferType = bufferState.type;
    const highlights = bufferState.source ? useAppSelector(getComputedSourceHighlightFromStateSelector) : null;
    const [prevWidth, setPrevWidth] = useState(0);
    const [prevHeight, setPrevHeight] = useState(0);

    const dispatch = useDispatch();

    useEffect(() => {
        if ((width !== prevWidth || height !== prevHeight) && width && height) {
            dispatch(bufferResize({buffer: bufferName}));
        }
        setPrevWidth(width);
        setPrevHeight(height);
    }, [props.width, props.height])

    const onInit = useCallback(() => {
        dispatch(bufferInit({buffer: bufferName, type: bufferType}));
    }, [bufferName, bufferType]);

    const onSelect = useCallback((selection: Range) => {
        dispatch(bufferSelect({buffer: bufferName, selection}))
    }, [bufferName]);

    const onEdit = useCallback((delta: TextDocumentDelta) => {
        dispatch(bufferEdit({buffer: bufferName, delta}));
    }, [bufferName]);

    const onEditPlain = useCallback((document: Document) => {
        dispatch(bufferEditPlain({buffer: bufferName, document}))
    }, [bufferName]);

    const onScroll = useCallback((firstVisibleRow: number) => {
        dispatch(bufferScrollToLine({buffer: bufferName, firstVisibleRow}));
    }, [bufferName]);

    const onDropBlock = useCallback((block: Block, pos: TextPosition) => {
        dispatch(bufferInsertBlock({buffer: bufferName, block, pos}));
    }, [bufferName]);

    if (BufferType.Block === bufferType) {
        return <BlocklyEditor
            key={bufferName}
            name={bufferName}
            state={bufferState as BlockBufferState}
            highlights={highlights}
            onInit={onInit}
            onSelect={onSelect}
            onEditPlain={onEditPlain}
            readOnly={props.readOnly}
        />
    }

    return <Editor
        key={bufferName}
        name={bufferName}
        state={bufferState as TextBufferState}
        highlights={highlights}
        onInit={onInit}
        onEdit={onEdit}
        onEditPlain={onEditPlain}
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
        hasScrollMargin={bufferState.source}
        dragEnabled={props.dragEnabled}
        {...props.editorProps}
    />;
}

export const BufferEditor = withResizeDetector(_BufferEditor);
