import React, {useCallback, useEffect, useState} from "react";
import {Editor, EditorProps} from "./Editor";
import {useDispatch} from "react-redux";
import {withResizeDetector} from "react-resize-detector";
import {BlocklyEditor} from "../stepper/js/BlocklyEditor";
import {hasBlockPlatform} from '../stepper/platforms';
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
import {getSourceHighlightFromStateSelector} from '../stepper';

interface BufferEditorProps {
    readOnly?: boolean,
    shield?: boolean,
    theme?: string,
    mode: string,
    requiredWidth: any,
    requiredHeight: any,
    width?: number,
    height?: number,
    buffer: string,
    hasAutocompletion?: boolean,
    platform?: CodecastPlatform,
    dragEnabled?: boolean,
    editorProps?: EditorProps,
}

const _BufferEditor = (props: BufferEditorProps) => {
    const {buffer, width, height, platform} = props;
    const bufferState = useAppSelector(state => state.buffers[buffer]);

    const [prevWidth, setPrevWidth] = useState(0);
    const [prevHeight, setPrevHeight] = useState(0);

    const dispatch = useDispatch();

    const bufferType = 'source' === buffer && hasBlockPlatform(platform) ? BufferType.Block : BufferType.Text;
    const highlight = useAppSelector(getSourceHighlightFromStateSelector);

    useEffect(() => {
        if ((width !== prevWidth || height !== prevHeight) && width && height) {
            dispatch(bufferResize({buffer}));
        }
        setPrevWidth(width);
        setPrevHeight(height);
    }, [props.width, props.height])

    const onInit = useCallback(() => {
        dispatch(bufferInit({buffer, type: bufferType}));
    }, [buffer, bufferType]);

    const onSelect = useCallback((selection: Range) => {
        dispatch(bufferSelect({buffer, selection}))
    }, [buffer]);

    const onEdit = useCallback((delta: TextDocumentDelta) => {
        dispatch(bufferEdit({buffer, delta}));
    }, [buffer]);

    const onEditPlain = useCallback((document: Document) => {
        dispatch(bufferEditPlain({buffer, document}))
    }, [buffer]);

    const onScroll = useCallback((firstVisibleRow: number) => {
        dispatch(bufferScrollToLine({buffer, firstVisibleRow}));
    }, [buffer]);

    const onDropBlock = useCallback((block: Block, pos: TextPosition) => {
        dispatch(bufferInsertBlock({buffer, block, pos}));
    }, [buffer]);

    if (BufferType.Block === bufferType) {
        return <BlocklyEditor
            name={buffer}
            state={bufferState as BlockBufferState}
            highlight={highlight}
            onInit={onInit}
            onSelect={onSelect}
            onEditPlain={onEditPlain}
            readOnly={props.readOnly}
        />
    }

    return <Editor
        name={buffer}
        state={bufferState as TextBufferState}
        highlight={highlight}
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
        hasScrollMargin={'source' === buffer}
        dragEnabled={props.dragEnabled}
        {...props.editorProps}
    />;
}

export const BufferEditor = withResizeDetector(_BufferEditor);
