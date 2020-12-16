import url from 'url';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import produce from "immer";

export const initialStateExamples = {
    fullExamplesUrl: ''
};

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft) => {
        draft.examples = updateExamplesState(draft, {});
    }));

    bundle.addReducer(ActionTypes.PlatformChanged, produce((draft) => {
        draft.examples = updateExamplesState(draft, draft.examples);
    }));
}

function updateExamplesState(state, examples) {
    const {callbackUrl, examplesUrl, platform, language} = state.options;
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
