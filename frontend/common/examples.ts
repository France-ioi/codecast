import url from 'url';
import {ExamplePicker} from "./ExamplePicker";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';

export default function (bundle, deps) {
    bundle.addReducer(AppActionTypes.AppInit, initReducer);

    bundle.addReducer(ActionTypes.PlatformChanged, platformChangedReducer);
}

function initReducer(state, _action) {
    return state.set('examples', updateExamplesState(state, {}));
}

function platformChangedReducer(state) {
    return state.update('examples', examples => updateExamplesState(state, examples));
}

function updateExamplesState(state, examples) {
    const {callbackUrl, examplesUrl, platform, language} = state.get('options');
    if (!examplesUrl) {
        return false;
    }

    /* Clean up the callback URL to avoid passing the current source to the
       examples selector.  Also clear 'platform' in case the user changes it
       in the selector. */
    let fullCallbackUrl = url.parse(callbackUrl, true);
    delete fullCallbackUrl.search; // force url.format to rebuild the search string
    delete fullCallbackUrl.query.source;
    delete fullCallbackUrl.query.platform;
    fullCallbackUrl.query.language = language;

    // @ts-ignore
    fullCallbackUrl = url.format(fullCallbackUrl);

    let fullExamplesUrl = url.parse(examplesUrl, true);
    fullExamplesUrl.query.target = '_self';
    fullExamplesUrl.query.tags = platform;
    /* XXX better to pass language unchanged and have the examples app drop the country code */
    fullExamplesUrl.query.lang = language.replace(/_.*$/, '');
    // @ts-ignore
    fullExamplesUrl.query.callback = fullCallbackUrl;
    // @ts-ignore
    fullExamplesUrl = url.format(fullExamplesUrl);

    return {...examples, fullExamplesUrl};
}
