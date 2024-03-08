import React from "react";
import AceEditor from "react-ace"
import "ace-builds"
import "ace-builds/src-noconflict/mode-html"
import "ace-builds/src-noconflict/theme-xcode"
import "ace-builds/src-noconflict/ext-beautify"
import "ace-builds/src-noconflict/ext-language_tools"
import 'ace-builds/webpack-resolver'
import {useDispatch} from 'react-redux';
import {isTouchDevice} from './html_editor_config';
import {bufferEditPlain} from '../buffers_slice';
import {TextBufferHandler} from '../document';

interface TextualHTMLEditorProps {
    elements: string,
    name: string,
}

export function TextualHTMLEditor(props: TextualHTMLEditorProps) {
    let editorRef: AceEditor | null
    const dispatch = useDispatch();

    const onChange = () => {
        const document = TextBufferHandler.documentFromString(editorRef!.editor.getValue());
        dispatch(bufferEditPlain({buffer: props.name, document}));
    };

    const onLoad = () => {
        if (isTouchDevice()) {
            // If using touch api, prevent default dragover and dragenter events on ace_content layer
            // This allows mobile-drag-drop shim, HTML5 dnd api, and ace to function together
            let aceContent = document.querySelector('.ace_content')
            if (aceContent) {
                aceContent.addEventListener('dragover', function (e) {
                    e.preventDefault()
                })
                aceContent.addEventListener('dragenter', function (e) {
                    e.preventDefault()
                })
            }
        }
    }

    return (
        <div className={'textual-html-editor'}>
            <AceEditor
                ref={node => {
                    editorRef = node
                }}
                mode={"html"}
                theme={"xcode"}
                debounceChangePeriod={300}
                onChange={onChange}
                onLoad={onLoad}
                name={"textual-html-editor-ace"}
                height={"100%"}
                width={"100%"}
                wrapEnabled={false}
                enableLiveAutocompletion={true}
                setOptions={{
                    cursorStyle: "wide",
                    fontSize: 14,
                    fontFamily: "Consolas, monospace",
                    dragEnabled: true,
                }}
                style={{
                    lineHeight: '26px',
                }}
                defaultValue={props.elements}
            />
        </div>
    )
}
