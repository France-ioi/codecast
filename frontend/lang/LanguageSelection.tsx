import React from "react";
import {getMessage, Languages} from "./index";
import {ActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";
import {isLocalStorageEnabled} from "../common/utils";
import {useAppSelector} from '../hooks';

interface LanguageSelectionProps {
    closeMenu: Function
}

const languageKeys = Object.keys(Languages);

export function LanguageSelection(props: LanguageSelectionProps) {
    const language = useAppSelector(state => state.options.language);

    const dispatch = useDispatch();

    const setLanguage = (event) => {
        const language = event.target.value;
        props.closeMenu();
        if (isLocalStorageEnabled()) {
            window.localStorage.setItem('language', language);
        }
        setTimeout(() => dispatch({type: ActionTypes.LanguageSet, payload: {language}}), 0);
    };

    return (
        <label className='bp3-label'>
            {getMessage('LANGUAGE:')}
            <div className='bp3-select'>
                <select onChange={setLanguage} value={language}>
                    {languageKeys.map(lang => {
                        const label = Languages[lang].language;

                        return <option key={lang} value={lang}>{label}</option>;
                    })}
                </select>
            </div>
        </label>
    );
}
