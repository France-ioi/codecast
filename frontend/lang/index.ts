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
import {delay} from "../player/sagas";

export const Languages = {
    'en-US': require('./en-US.js'),
    'fr-FR': require('./fr-FR.js'),
};

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state, {payload: {options}}) => {
        let language = 'fr-FR';
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
            yield* delay(0);
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
let localGetMessageChoices;
let localGetFormat;

function setLanguageReducer(state: AppStore, {payload: {language}}) {
    if (!Languages[language]) {
        language = 'fr-FR';
    }

    const familiarEnabled = 'tralalere' === state.options.app;

    const localizedMessage = Object.create(Message, {
        _l: {
            writable: false,
            configurable: false,
            value: language
        }
    });

    localGetMessage = memoize(function(message, defaultText) {
        const value = Languages[language][message + (familiarEnabled ? '_FAMILIAR' : '')] || Languages[language][message] || defaultText || `L:${message}`;

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

    localGetFormat = function(value) {
        if (value instanceof Error && value.name === 'LocalizedError') {
            // @ts-ignore
            return localGetMessage(value.message).format(value.args);
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
