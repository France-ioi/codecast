import React from 'react';
import {useDispatch} from "react-redux";
import {documentationLanguageChanged} from "./documentation_slice";
import {select} from "typed-redux-saga";
import {useAppSelector} from '../../hooks';
import {getMessage} from '../../lang';

export function DocumentationLanguageSelector() {
    const documentationLanguage = useAppSelector(state => state.documentation.language);
    const availablePlatforms = useAppSelector(state => state.task.availablePlatforms);
    const dispatch = useDispatch();

    const setDocumentationLanguage = (event) => {
        const language = event.target.value;
        dispatch(documentationLanguageChanged(language));
    };

    return (
        <label className='bp3-label documentation-select'>
            <div className='bp3-select'>
                <select onChange={setDocumentationLanguage} value={documentationLanguage}>
                    {availablePlatforms.map(platform =>
                        <option key={platform} value={platform}>{getMessage(`PLATFORM_${platform.toLocaleUpperCase()}`)}</option>
                    )}
                </select>
            </div>
        </label>
    )
}
