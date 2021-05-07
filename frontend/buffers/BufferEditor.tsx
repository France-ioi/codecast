import React from "react";
import {Editor} from "./Editor";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";
import {withResizeDetector} from 'react-resize-detector/build/withPolyfill';

interface BufferEditorDispatchToProps {
    dispatch: Function
}

interface BufferEditorProps extends BufferEditorDispatchToProps {
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

export class _BufferEditor extends React.PureComponent<BufferEditorProps> {
    componentDidUpdate(prevProps) {
        const {width, height} = this.props;
        if (width !== prevProps.width || height !== prevProps.height) {
            const {dispatch, buffer} = this.props;
            dispatch({type: ActionTypes.BufferResize, buffer});
        }
    }

    onInit = (editor) => {
        const {dispatch, buffer} = this.props;

        dispatch({type: ActionTypes.BufferInit, buffer, editor})
    };

    onSelect = (selection) => {
        const {dispatch, buffer} = this.props;

        dispatch({type: ActionTypes.BufferSelect, buffer, selection});
    };

    onEdit = (delta) => {
        const {dispatch, buffer} = this.props;

        dispatch({type: ActionTypes.BufferEdit, buffer, delta});
    };

    onScroll = (firstVisibleRow) => {
        const {dispatch, buffer} = this.props;

        dispatch({type: ActionTypes.BufferScroll, buffer, firstVisibleRow});
    };

    render() {
        return <Editor
            onInit={this.onInit}
            onEdit={this.onEdit}
            onSelect={this.onSelect}
            onScroll={this.onScroll}
            readOnly={this.props.readOnly}
            shield={this.props.shield}
            theme={this.props.theme}
            mode={this.props.mode}
            width={this.props.requiredWidth}
            height={this.props.requiredHeight}
            hasAutocompletion={this.props.hasAutocompletion}
        />;
    };
}

export const BufferEditor = connect()(withResizeDetector(_BufferEditor));
