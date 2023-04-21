import React from 'react';
import {useDispatch} from "react-redux";
import {documentationLanguageChanged} from "./documentation_slice";
import {select} from "typed-redux-saga";
import {useAppSelector} from '../../hooks';
import {platformsList} from '../../stepper/platforms';
import {getMessage} from '../../lang';

export function DocumentationLanguageSelector() {
    const documentationLanguage = useAppSelector(state => state.documentation.language);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const dispatch = useDispatch();

    const setDocumentationLanguage = (event) => {
        const language = event.target.value;
        dispatch(documentationLanguageChanged(language));
    };

    let availablePlatforms = Object.keys(platformsList);
    if (null !== currentTask && currentTask.supportedLanguages && currentTask.supportedLanguages.length) {
        availablePlatforms = availablePlatforms.filter(platform => -1 !== currentTask.supportedLanguages.indexOf(platform));
    }

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
