import IntlMessageFormat from 'intl-messageformat';
import memoize from 'lodash.memoize';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import produce from "immer";
import {AppStore} from "../store";

export const Languages = {
    'en-US': require('./en-US.js'),
    'fr-FR': require('./fr-FR.js'),
};

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft, {payload: {options}}) => {
        let language = 'en-US';
        if (navigator.language in Languages) {
            language = navigator.language;
        }
        if (window.localStorage.language && window.localStorage.language in Languages) {
            language = window.localStorage.language;
        }
        if (language in options && options.language in Languages) {
            language = options.language;
        }

        return setLanguageReducer(draft, {payload: {language}});
    }));

    bundle.defineAction(ActionTypes.LanguageSet);
    bundle.addReducer(ActionTypes.LanguageSet, produce(setLanguageReducer));
}

const Message = {
    toString: function() {
        return this._m;
    },
    format: function(...args) {
        if (!this._f) {
            this._f = new IntlMessageFormat(this._m, this._l);
        }
        return this._f.format(...args);
    },
    [Symbol.iterator]: function* () {
        yield this.toString();
    }
};
Object.defineProperty(Message, 's', {
    get() {
        return this.toString();
    }
});

function setLanguageReducer(draft: AppStore, {payload: {language}}) {
    if (!Languages[language]) {
        language = 'en-US';
    }

    const localizedMessage = Object.create(Message, {
        _l: {
            writable: false,
            configurable: false,
            value: language
        }
    });
    const getMessage = memoize(function(message, defaultText) {
        const value = Languages[language][message] || defaultText || `L:${message}`;

        return Object.create(localizedMessage, {
            _m: {
                writable: false,
                configurable: false,
                value
            }
        });
    });

    getMessage.format = function(value) {
        if (value instanceof Error && value.name === 'LocalizedError') {
            // @ts-ignore
            return getMessage(value.message).format(value.args);
        }

        return getMessage(value.toString());
    }

    draft.options.language = language;
    draft.getMessage = getMessage;
}

export class LocalizedError extends Error {
    constructor(message, public args) {
        super(message);
        this.name = 'LocalizedError';
        this.args = args;
    }
}
