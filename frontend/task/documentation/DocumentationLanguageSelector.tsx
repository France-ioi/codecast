import React from 'react';
import {useDispatch} from "react-redux";
import {documentationLanguageChanged} from "./documentation_slice";
import {useAppSelector} from '../../hooks';
import {platformsList} from '../../stepper/platforms';

export function DocumentationLanguageSelector() {
    const documentationLanguage = useAppSelector(state => state.documentation.language);
    const availablePlatforms = useAppSelector(state => state.task.availablePlatforms);
    const dispatch = useDispatch();

    const setDocumentationLanguage = (event) => {
        const language = event.target.value;
        dispatch(documentationLanguageChanged(language));
    };

    return (
        <label className='bp4-label documentation-select'>
            <div className='bp4-select'>
                <select onChange={setDocumentationLanguage} value={documentationLanguage}>
                    {availablePlatforms.map(platform =>
                        <option key={platform} value={platform}>{platformsList[platform].name}</option>
                    )}
                </select>
            </div>
        </label>
    )
}
