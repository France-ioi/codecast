import {filterItems} from './utils';
import {ActionTypes} from "./actionTypes";
import {SubtitlesPane} from "./SubtitlesPane";

export default function (bundle) {
    bundle.defineAction(ActionTypes.SubtitlesFilterTextChanged);
    bundle.addReducer(ActionTypes.SubtitlesFilterTextChanged, subtitlesFilterTextChangedReducer);
}

function subtitlesFilterTextChangedReducer(state, {payload: {text}}) {
    return state.update('subtitles', function (subtitles) {
        let re = null;
        if (text) {
            try {
                re = new RegExp(text, 'i');
            } catch (ex) {
                /* silently ignore error, keep last regexp */
                re = subtitles.filterRegexp;
            }
        }
        return {
            ...subtitles,
            filterText: text,
            filterRegexp: re,
            filteredItems: filterItems(subtitles.items, re)
        };
    });
}
