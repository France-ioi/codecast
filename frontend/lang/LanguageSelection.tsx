import React from "react";
import {getMessage, Languages} from "./index";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface LanguageSelectionStoreToProps {
    language: string,
}

function mapStateToProps(state: AppStore): LanguageSelectionStoreToProps {
    const language = state.options.language;

    return {language};
}

interface LanguageSelectionDispatchToProps {
    dispatch: Function
}

interface LanguageSelectionProps extends LanguageSelectionStoreToProps, LanguageSelectionDispatchToProps {
    closeMenu: Function
}

const languageKeys = Object.keys(Languages);

class _LanguageSelection extends React.PureComponent<LanguageSelectionProps> {
    render() {
        const {language} = this.props;
        return (
            <label className='bp3-label'>
                {getMessage('LANGUAGE:')}
                <div className='bp3-select'>
                    <select onChange={this.setLanguage} value={language}>
                        {languageKeys.map(lang => {
                            const label = Languages[lang].language;
                            return <option key={lang} value={lang}>{label}</option>;
                        })}
                    </select>
                </div>
            </label>
        );
    }

    setLanguage = (event) => {
        const language = event.target.value;
        const {closeMenu, dispatch} = this.props;
        closeMenu();
        try {
            window.localStorage.setItem('language', language);
        } catch (ex) {
            // No local storage access.
        }
        setTimeout(() => dispatch({type: ActionTypes.LanguageSet, payload: {language}}), 0);
    };
}

export const LanguageSelection = connect(mapStateToProps)(_LanguageSelection);
