import Immutable from 'immutable';

import loadingBundle from './loading';
import paneBundle from './pane';
import bandBundle from './band';
import replayBundle from './replay';
import editorBundle from './editor';
import {getPersistentOptions, setPersistentOption} from './options';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export const initialStateSubtitles = {
    langOptions: [
        {value: 'fr-FR', label: "Français", countryCode: 'fr'},
        {value: 'en-US', label: "English", countryCode: 'us'},
    ],
    editing: false,
    paneEnabled: false,
    bandEnabled: false,
    /* player-specific */
    filterText: '',
    filterRegexp: null,
    /* editor-specific */
    notify: {
        key: '',
        message: ''
    },
    trim: {
        loaded: [],
    },
    text: '',
    items: [],
    currentIndex: 0,
    audioTime: 0,
    loaded: false,
    itemVisible: false,
    isMoving: false,
    startY: 0,
    offsetY: 0,
    unsaved: false,
    availableOptions: [], // TODO: type
    selectedKey: 0,
    filteredItems: [],
    loadedKey: 'none',
    lastError: '',
    loading: false
};

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        const {paneEnabled, bandEnabled} = getPersistentOptions();

        draft.subtitles = initialStateSubtitles;
        draft.subtitles.paneEnabled = paneEnabled;
        draft.subtitles.bandEnabled = bandEnabled;
    }));

    bundle.include(loadingBundle);
    bundle.include(paneBundle);
    bundle.include(bandBundle);
    bundle.include(replayBundle);
    bundle.include(editorBundle);

    bundle.defineAction(ActionTypes.SubtitlesEditingChanged);
    bundle.addReducer(ActionTypes.SubtitlesEditingChanged, produce(subtitlesEditingChangedReducer));

    bundle.defineAction(ActionTypes.SubtitlesPaneEnabledChanged);
    bundle.addReducer(ActionTypes.SubtitlesPaneEnabledChanged, produce(subtitlesPaneEnabledChangedReducer));

    bundle.defineAction(ActionTypes.SubtitlesBandEnabledChanged);
    bundle.addReducer(ActionTypes.SubtitlesBandEnabledChanged, produce(subtitlesBandEnabledChangedReducer));
}

function subtitlesEditingChangedReducer(draft: AppStore, {payload: {editing}}): void {
    draft.subtitles.editing = editing;

    draftUpdateSubtitlesPaneVisibility(draft);
}

function subtitlesPaneEnabledChangedReducer(draft: AppStore, {payload: {value}}): void {
    draft.subtitles.paneEnabled = value;

    draftUpdateSubtitlesPaneVisibility(draft);

    setPersistentOption('paneEnabled', value);
}

function draftUpdateSubtitlesPaneVisibility(draft: AppStore) {
    const {editing, loading, loadedKey, paneEnabled} = draft.subtitles;
    const isLoaded = !loading && loadedKey !== 'none';

    /* Editor: the subtitles editor pane is always visible.
       Player: the subtitles pane is visible if subtitles are loaded,
               and if the pane is enabled in the CC settings. */
    const enabled = editing || (isLoaded && paneEnabled);
    const width = 200;

    let view = (editing) ? 'editor' : 'subtitles';

    draft.panes['subtitles'] = {view, editing, enabled, width};
}

function subtitlesBandEnabledChangedReducer(draft: AppStore, {payload: {value}}): void {
    setPersistentOption('bandEnabled', value);

    draft.subtitles.bandEnabled = value;
}
