import React from "react";
import {Editor} from "./Editor";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";

interface BufferEditorDispatchToProps {
    dispatch: Function
}

interface BufferEditorProps extends BufferEditorDispatchToProps {
    readOnly?: boolean,
    shield?: boolean,
    theme?: string,
    mode: string,
    width: any,
    height: any,
    buffer: any
}

export class _BufferEditor extends React.PureComponent<BufferEditorProps> {
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
            width={this.props.width}
            height={this.props.height}
        />;
    };
}

export const BufferEditor = connect()(_BufferEditor);
