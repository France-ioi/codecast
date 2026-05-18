import enUS from './en-US';
import frFR from './fr-FR';
import nlBE from './nl-BE';
import IntlMessageFormat from 'intl-messageformat';
import {AppStore} from '../store';
import {current, isDraft} from 'immer';
import memoize from 'lodash/memoize';

export const Languages = {
    'en-US': enUS,
    'fr-FR': frFR,
    'nl-BE': nlBE,
};
export const Message = {
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

let localGetMessage;
let localGetMessageChoices;
let localGetFormat;

export function setLanguageReducer(state: AppStore, {payload: {language}}) {
    if (!Languages[language]) {
        language = 'fr-FR';
    }

    state.options.language = language;
    updateLanguageCalls(state);
}

export function updateLanguageCalls(state: AppStore) {
    const language = state.options.language;
    const familiarEnabled = 'tralalere' === state.options.app;
    const currentTask = state.task.currentTask;
    window.stringsLanguage = language.split('-')[0];

    const taskStrings = isDraft(currentTask?.gridInfos?.taskStrings) ? current(currentTask?.gridInfos?.taskStrings) : currentTask?.gridInfos?.taskStrings;
    const languageKeys = {
        ...Languages[language],
        ...(taskStrings ?? {}),
    };

    const localizedMessage = Object.create(Message, {
        _l: {
            writable: false,
            configurable: false,
            value: language
        }
    });

    localGetMessage = memoize(function (message, defaultText) {
        const value = languageKeys[message + (familiarEnabled ? '_FAMILIAR' : '')] || languageKeys[message] || defaultText || `L:${message}`;

        return Object.create(localizedMessage, {
            _m: {
                writable: false,
                configurable: false,
                value
            }
        });
    });

    localGetMessageChoices = function (value, number) {
        const string = localGetMessage(value.toString());
        const elements = string ? string._m.split('|') : '';

        if (elements.length === 2) {
            return number > 1 ? elements[1] : elements[0];
        }
        if (elements.length === 3) {
            return number > 1 ? elements[2] : (number === 1 ? elements[1] : elements[0]);
        }

        return string;
    }

    localGetFormat = function (value) {
        if (value instanceof Error && value.name === 'LocalizedError') {
            // @ts-ignore
            return localGetMessage(value.message).format(value.args);
        }

        return localGetMessage(value.toString());
    }
}

export const getMessage = (message, defaultText = null) => {
    return localGetMessage(message, defaultText);
}
export const getMessageFormat = (value) => {
    return localGetFormat(value);
}
export const getMessageChoices = (value, number) => {
    return localGetMessageChoices(value, number);
}

export class LocalizedError extends Error {
    constructor(message, public args) {
        super(message);
        this.name = 'LocalizedError';
        this.args = args;
    }
}

Object.defineProperty(Message, 's', {
    get() {
        return this.toString();
    }
});
