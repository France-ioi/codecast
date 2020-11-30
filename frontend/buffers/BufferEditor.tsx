import React from "react";
import {Editor} from "./Editor";
import {ActionTypes} from "./actionTypes";

interface BufferEditorProps {
    dispatch: Function,
    buffer: any
}

export class BufferEditor extends React.PureComponent<BufferEditorProps> {
    onInit = (editor) => {
        const {dispatch, buffer} = this.props;

        dispatch({type: ActionTypes.BufferInit, buffer, editor});
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
        // @ts-ignore
        return <Editor
            onInit={this.onInit}
            onEdit={this.onEdit}
            onSelect={this.onSelect}
            onScroll={this.onScroll}
            {...this.props}
        />;
    };
}
