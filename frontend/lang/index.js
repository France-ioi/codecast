
import React from 'react';
import {Button, Popover, Menu, MenuItem} from '@blueprintjs/core';

import IntlMessageFormat from 'intl-messageformat';
import memoize from 'lodash.memoize';

const Languages = {
  'en-US': require('./en-US.js'),
  'fr-FR': require('./fr-FR.js'),
};
const languageKeys = Object.keys(Languages);

const Message = {
  toString: function () {
    return this._m;
  },
  format: function (...args) {
    if (!this._f) {
      this._f = new IntlMessageFormat(this._m, this._l);
    }
    return this._f.format(...args);
  },
  [Symbol.iterator]: function* () {
    yield this.toString();
  }
};
Object.defineProperty(Message, 's', { get() { return this.toString(); } });

function initReducer (state, _action) {
  const language = window.localStorage.language || navigator.language;
  return setLanguageReducer(state, {payload: {language}});
}

function setLanguageReducer (state, {payload: {language}}) {
  if (!Languages[language]) language = 'en-US';
  window.localStorage.language = language;
  const localizedMessage = Object.create(Message,
      {_l: {writable: false, configurable: false, value: language}});
  const getMessage = memoize(function (message, defaultText) {
    const value = Languages[language][message] || defaultText || `L:${message}`;
    return Object.create(localizedMessage,
      {_m: {writable: false, configurable: false, value}});
  });
  getMessage.format = function (value) {
    if (value instanceof Error && value.name === 'LocalizedError') {
      return getMessage(value.message).format(value.args);
    }
    return getMessage(value.toString());
  }
  return state.set('language', language).set('getMessage', getMessage);
}

class LanguageSelection extends React.PureComponent {
  render() {
    const {language, getMessage} = this.props;
    return (
      <div className='pt-select'>
        <label className='pt-label'>
          {getMessage('LANGUAGE:')}
          <select onChange={this.setLanguage} value={language}>
            {languageKeys.map(lang => {
              const label = Languages[lang].language;
              return <option key={lang} value={lang}>{label}</option>;
            })}
          </select>
        </label>
      </div>
    );
  }
  setLanguage = (event) => {
    const language = event.target.value;
    const {closeMenu, dispatch, setLanguage} = this.props;
    closeMenu();
    setTimeout(() => dispatch({type: setLanguage, payload: {language}}), 0);
  };
}

function LanguageSelectionSelector (state) {
  const {setLanguage} = state.get('actionTypes');
  const language = state.get('language');
  const getMessage = state.get('getMessage');
  return {setLanguage, language, getMessage};
}

export default function (bundle, deps) {
  bundle.addReducer('init', initReducer);
  bundle.defineAction('setLanguage', 'Language.Set');
  bundle.addReducer('setLanguage', setLanguageReducer);
  bundle.defineView('LanguageSelection', LanguageSelectionSelector, LanguageSelection);
}

export class LocalizedError extends Error {
  constructor (message, args) {
    super(message);
    this.name = 'LocalizedError';
    this.args = args;
  }
}
