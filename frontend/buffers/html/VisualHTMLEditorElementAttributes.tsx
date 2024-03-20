import React, {FormEvent, useCallback, useState} from "react";
import {CodeSegment} from './html_editor_config';
import {AnchorButton, Button, FormGroup, InputGroup} from '@blueprintjs/core';
import {getMessage} from '../../lang';
import {IconNames} from '@blueprintjs/icons';
import {bufferInit, visualEditorElementEdit} from '../buffers_slice';
import {bufferChangePlatform} from '../buffer_actions';
import {useDispatch} from 'react-redux';
import {useAppSelector} from '../../hooks';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';

interface ElementAttributesProps {
    codeSegment: CodeSegment,
    onClose: () => void,
}

interface HtmlAttribute {
    name: string,
    value: string,
    removable: boolean,
}

const attributesAlwaysPresent = [
    'id',
    'class',
];

export function VisualHTMLEditorElementAttributes(props: ElementAttributesProps) {
    const codeSegment = props.codeSegment;
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);

    let defaultHtmlAttributes = [];
    let defaultHtmlAttributesCompleted = {};
    for (let attr of attributesAlwaysPresent) {
        defaultHtmlAttributesCompleted[attr] = '';
    }

    defaultHtmlAttributesCompleted = {
        ...defaultHtmlAttributesCompleted,
        ...(codeSegment.htmlAttributes ? codeSegment.htmlAttributes : {}),
    };

    const appearedNames = {};
    for (let [name, value] of Object.entries(defaultHtmlAttributesCompleted)) {
        defaultHtmlAttributes.push({
            name,
            value,
            removable: -1 === attributesAlwaysPresent.indexOf(name) || name in appearedNames,
        });
        appearedNames[name] = true;
    }

    const [htmlAttributes, setHtmlAttributes] = useState<HtmlAttribute[]>(defaultHtmlAttributes);

    const dispatch = useDispatch();

    const saveElement = (e: FormEvent<HTMLFormElement>) => {
        const htmlAttributesObject = {};
        for (let {name, value} of htmlAttributes) {
            if (!name || !name.match(/^[a-zA-Z\-._]+/) || !value) {
                continue;
            }
            htmlAttributesObject[name] = value;
        }

        const newCodeSegment: CodeSegment = {
            ...codeSegment,
            htmlAttributes: htmlAttributesObject,
        };
        e.preventDefault();
        dispatch(visualEditorElementEdit({buffer: activeBufferName, elementIndex: codeSegment.index, codeSegment: newCodeSegment}));
        props.onClose();
    };

    const changeHtmlAttribute = (index: number, property: string, value: string) => {
        const newHtmlAttributes = [
            ...htmlAttributes,
        ];
        newHtmlAttributes.splice(index, 1, {
            ...newHtmlAttributes[index],
            [property]: value,
        });
        setHtmlAttributes(newHtmlAttributes);
    };

    const addNewHtmlAttribute = () => {
        setHtmlAttributes([
            ...htmlAttributes,
            {name: '', value: '', removable: true},
        ]);
    };

    const removeHtmlAttribute = (index: number) => {
        const newHtmlAttributes = [
            ...htmlAttributes,
        ];
        newHtmlAttributes.splice(index, 1);
        setHtmlAttributes(newHtmlAttributes);
    };

    return (
        <form onSubmit={saveElement} className="html-tag-attributes">
            {htmlAttributes.map(({name, value, removable}, index) =>
                <div
                    key={index}
                    className="html-tag-attribute mb-1"
                >
                    <InputGroup
                        type='text'
                        value={name}
                        onChange={(event) => changeHtmlAttribute(index, 'name', event.target.value)}
                        readOnly={!removable}
                    />

                    <InputGroup
                        type='text'
                        value={value}
                        onChange={(event) => changeHtmlAttribute(index, 'value', event.target.value)}
                    />

                    {removable ? <div className="html-tag-attribute-remove" onClick={() => removeHtmlAttribute(index)}>
                        <FontAwesomeIcon icon={faTimes}/>
                    </div> : <div className="html-tag-attribute-remove-placeholder"/>}
                </div>
            )}

            <div onClick={addNewHtmlAttribute} className="html-tag-new-attribute mb-2">
                <FontAwesomeIcon icon={faPlus}/>
                <span>Nouvel attribut</span>
            </div>

            <div>
                <Button
                    type="submit"
                    className="quickalgo-button is-fullwidth"
                >
                    Enregistrer
                </Button>
            </div>
        </form>
    )
}
