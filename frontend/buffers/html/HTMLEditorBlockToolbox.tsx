import React from "react";
import {ToolboxConfiguration} from "./html_editor_config"
import {Droppable} from "react-beautiful-dnd";
import {useDispatch} from 'react-redux';
import {HTMLEditorBlockCategory} from './HTMLEditorBlockCategory';
import {switchEditorMode} from '../buffers_slice';
import {useAppSelector} from '../../hooks';

interface BlocksToolboxProps {
    categories: ToolboxConfiguration,
    allowModeSwitch: boolean
}

export function HTMLEditorBlockToolbox(props: BlocksToolboxProps) {
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);
    const dispatch = useDispatch();

    const editorSwitcher: JSX.Element = <>
        <input
            type={"checkbox"}
            id={'editor-mode-toggle'}
            onChange={() => dispatch(switchEditorMode({buffer: activeBufferName}))}
        />
        <label htmlFor={'editor-mode-toggle'}>Toggle Visual/Textual</label>
    </>

    return (
        <Droppable droppableId={'toolbox-dropzone'} isDropDisabled={false}>
            {provided => (
                <div
                    className={'toolbox'}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                    {props.categories.categories.map(category => {
                        return (
                            <HTMLEditorBlockCategory
                                key={category.id}
                                id={category.id}
                                name={category.name}
                                highlight={category.highlight}
                                blocks={category.blocks}
                                openDesc={category.openDesc}
                            />
                        )
                    })}
                    {/* TODO Move input */}
                    {props.allowModeSwitch ? editorSwitcher : ''}
                </div>
            )}
        </Droppable>
    )
}
