import {filterItems} from './utils';
import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export default function(bundle) {
    bundle.defineAction(ActionTypes.SubtitlesFilterTextChanged);
    bundle.addReducer(ActionTypes.SubtitlesFilterTextChanged, produce(subtitlesFilterTextChangedReducer));
}

function subtitlesFilterTextChangedReducer(draft: AppStore, {payload: {text}}): void {
    let re = null;
    if (text) {
        try {
            re = new RegExp(text, 'i');
        } catch (ex) {
            /* silently ignore error, keep last regexp */
            re = draft.subtitles.filterRegexp;
        }
    }

    draft.subtitles.filterText = text;
    draft.subtitles.filterRegexp = re;
    draft.subtitles.filteredItems = filterItems(draft.subtitles.items, re)
}
