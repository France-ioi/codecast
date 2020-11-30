import {SubtitlesMenu} from "./SubtitlesMenu";
import {SubtitlesPopup} from "./SubtitlesPopup";

export default function (bundle) {
    bundle.defineView('SubtitlesMenu', SubtitlesMenuSelector, SubtitlesMenu);
    bundle.defineView('SubtitlesPopup', SubtitlesPopupSelector, SubtitlesPopup);
}

function SubtitlesMenuSelector(state, props) {
    const subtitles = state.get('subtitles');
    if (subtitles.editing) {
        return {hidden: true};
    }

    const playerData = state.getIn(['player', 'data']);
    if (!playerData || !playerData.subtitles || playerData.subtitles.length === 0) {
        return {hidden: true};
    }

    const {SubtitlesPopup} = state.get('scope');
    const getMessage = state.get('getMessage');

    return {getMessage, SubtitlesPopup};
}

function SubtitlesPopupSelector(state, props) {
    const {loadedKey, loading, lastError, availableOptions, langOptions, paneEnabled, bandEnabled} = state.get('subtitles');
    const {subtitlesCleared, subtitlesLoadFromUrl, subtitlesPaneEnabledChanged, subtitlesBandEnabledChanged} = state.get('scope');
    const getMessage = state.get('getMessage');
    const isLoaded = !loading && loadedKey !== 'none';

    return {
        availableOptions, langOptions, loadedKey, isLoaded, busy: !!loading, lastError,
        subtitlesCleared, subtitlesLoadFromUrl,
        paneEnabled, subtitlesPaneEnabledChanged,
        bandEnabled, subtitlesBandEnabledChanged, getMessage
    };
}
