
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
      this._f = new IntlMessageFormat(this._m, language);
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
    return state.set('getMessage', (message) => languageNotSet);
  });
  bundle.defineAction('setLanguage', 'Language.Set');
  bundle.addReducer('setLanguage', function (state, {language}) {
    if (!Messages[language]) language = 'en-US';
    window.localStorage.language = language;
    const getMessage = memoize(function (message) {
      const value = Messages[language][message] || `L:${message}`;
      return Object.create(Message,
        {_m: {writable: false, configurable: false, value}});
    });
    return state.set('getMessage', getMessage);
  });

};
