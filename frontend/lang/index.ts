import IntlMessageFormat from 'intl-messageformat';
import memoize from 'lodash.memoize';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {put, takeEvery} from "typed-redux-saga";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {taskLoad} from "../task";
import {isLocalStorageEnabled} from "../common/utils";

export const Languages = {
    'en-US': require('./en-US.js'),
    'fr-FR': require('./fr-FR.js'),
};

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state, {payload: {options}}) => {
        let language = 'en-US';
        if (navigator.language in Languages) {
            language = navigator.language;
        }
        if (isLocalStorageEnabled() && window.localStorage.getItem('language') && window.localStorage.getItem('language') in Languages) {
            language = window.localStorage.getItem('language');
        }
        if (options.language && options.language in Languages) {
            language = options.language;
        }

        window.stringsLanguage = language.split('-')[0];

        return setLanguageReducer(state, {payload: {language}});
    });

    bundle.defineAction(ActionTypes.LanguageSet);
    bundle.addReducer(ActionTypes.LanguageSet, setLanguageReducer);

    bundle.addSaga(function* () {
        // Quit stepper and reload task (and current context) after each language selection
        yield* takeEvery(ActionTypes.LanguageSet, function* () {
            yield* put({type: StepperActionTypes.StepperExit});
            yield* put(taskLoad({reloadContext: true}));
        });
    });
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

let localGetMessage;
let localGetFormat;

function setLanguageReducer(state: AppStore, {payload: {language}}) {
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

    localGetMessage = memoize(function(message, defaultText) {
        const value = Languages[language][message] || defaultText || `L:${message}`;

        return Object.create(localizedMessage, {
            _m: {
                writable: false,
                configurable: false,
                value
            }
        });
    });

    localGetFormat = function(value) {
        if (value instanceof Error && value.name === 'LocalizedError') {
            // @ts-ignore
            return getMessage(value.message).format(value.args);
        }

        return localGetMessage(value.toString());
    }

    state.options.language = language;
    window.stringsLanguage = language.split('-')[0];
}

export const getMessage = (message, defaultText = null) => {
    return localGetMessage(message, defaultText);
}

export const getMessageFormat = (value) => {
    return localGetFormat(value);
}

export class LocalizedError extends Error {
    constructor(message, public args) {
        super(message);
        this.name = 'LocalizedError';
        this.args = args;
    }
}
