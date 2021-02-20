import {filterItems} from './utils';
import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.SubtitlesFilterTextChanged);
    bundle.addReducer(ActionTypes.SubtitlesFilterTextChanged, subtitlesFilterTextChangedReducer);
}

function subtitlesFilterTextChangedReducer(state: AppStore, {payload: {text}}): void {
    let re = null;
    if (text) {
        try {
            re = new RegExp(text, 'i');
        } catch (ex) {
            /* silently ignore error, keep last regexp */
            re = state.subtitles.filterRegexp;
        }
    }

    state.subtitles.filterText = text;
    state.subtitles.filterRegexp = re;
    state.subtitles.filteredItems = filterItems(state.subtitles.items, re)
}
