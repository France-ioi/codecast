
import IntlMessageFormat from 'intl-messageformat';
import memoize from 'lodash.memoize';

const Messages = {
  'en-US': require('./en-US.js'),
  'fr-FR': require('./fr-FR.js')
};

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

export default function (bundle, deps) {

  const languageNotSet = {
    format: () => "???",
    toString: () => "???"
  };
  bundle.addReducer('init', function (state, action) {
    return state.set('availableLanguages', Object.keys(Messages))
      .set('getMessage', (message) => languageNotSet);
  });
  bundle.defineAction('setLanguage', 'Language.Set');
  bundle.addReducer('setLanguage', function (state, {language}) {
    if (!Messages[language]) language = 'en-US';
    window.localStorage.language = language;
    const localizedMessage = Object.create(Message,
        {_l: {writable: false, configurable: false, value: language}});
    const getMessage = memoize(function (message) {
      const value = Messages[language][message] || `L:${message}`;
      return Object.create(localizedMessage,
        {_m: {writable: false, configurable: false, value}});
    });
    getMessage.format = function (value) {
      console.log('getMessage.format', value);
      if (value instanceof Error && value.name === 'LocalizedError') {
        return getMessage(value.message).format(value.args);
      }
      return getMessage(value.toString());
    }
    return state.set('language', language).set('getMessage', getMessage);
  });

};

export class LocalizedError extends Error {
  constructor (message, args) {
    super(message);
    this.name = 'LocalizedError';
    this.args = args;
  }
};
