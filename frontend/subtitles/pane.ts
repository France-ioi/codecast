import {filterItems} from './utils';
import {ActionTypes} from "./actionTypes";
import {SubtitlesPane} from "./SubtitlesPane";

export default function (bundle) {
    bundle.defineView('SubtitlesPane', SubtitlesPaneSelector, SubtitlesPane);

    bundle.defineAction(ActionTypes.SubtitlesFilterTextChanged);
    bundle.addReducer(ActionTypes.SubtitlesFilterTextChanged, subtitlesFilterTextChangedReducer);
}

function SubtitlesPaneSelector(state, props) {
    const getMessage = state.get('getMessage');
    const {subtitlesFilterTextChanged, playerSeek} = state.get('actionTypes');
    const windowHeight = state.get('windowHeight');
    const {filteredItems, currentIndex, audioTime, filterText, filterRegexp} = state.get('subtitles');

    return {
        subtitlesFilterTextChanged, playerSeek, getMessage,
        subtitles: filteredItems,
        currentIndex, audioTime, filterText, filterRegexp, windowHeight
    };
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
